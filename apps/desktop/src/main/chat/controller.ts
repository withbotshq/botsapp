import {encoding_for_model} from '@dqbd/tiktoken'
import {assert} from '@jclem/assert'
import {Message, MessageBase} from '@withbotshq/shared/schema'
import {BrowserWindow} from 'electron'
import {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions'
import {z} from 'zod'
import {config} from '../config/config'
import {createMessage, getChat, listMessages} from '../db/db'
import {FunctionController} from './function-controller'

const gpt35encoding = encoding_for_model('gpt-3.5-turbo')
const gpt4encoding = encoding_for_model('gpt-4')
const gpt35maxSize = 4096
const gpt3516kMaxSize = 16384
const gpt4maxSize = 8192
const REPLY_MAX_TOKENS = 1024

const RoleChoice = z.object({
  delta: z.object({role: z.string()}),
  index: z.number(),
  finish_reason: z.null()
})

type RoleChoice = z.infer<typeof RoleChoice>

const ContentChoice = z.object({
  delta: z.object({content: z.string()}),
  index: z.number(),
  finish_reason: z.null()
})

type ContentChoice = z.infer<typeof ContentChoice>

const StopChoice = z.object({
  delta: z.object({}),
  index: z.number(),
  finish_reason: z.string()
})

type StopChoice = z.infer<typeof StopChoice>

const FunctionChoice = z.object({
  delta: z.object({
    role: z.literal('assistant').optional(),
    content: z.null().optional(),
    function_call: z.object({
      name: z.string().optional(),
      arguments: z.string().optional()
    })
  })
})

type FunctionChoice = z.infer<typeof FunctionChoice>

const CompletionChunk = z.object({
  id: z.string(),
  object: z.literal('chat.completion.chunk'),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.union([FunctionChoice, RoleChoice, ContentChoice, StopChoice])
  )
})

type CompletionChunk = z.infer<typeof CompletionChunk>

type PartialMessage = {
  abortController: AbortController
  chunks: string[]
}

export class ChatController {
  #partialMessages: Map<
    number,
    {
      abortController: AbortController
      chunks: string[]
    }
  > = new Map()

  #windows: Set<BrowserWindow> = new Set()

  readonly #systemMessage: MessageBase = {
    role: 'system',
    content: `You are Chat, an AI assistant based on OpenAI's GPT
  models. Follow the user's instructions carefully, but be concise. Do not offer
  great detail unless the user asks for it. Respond using Markdown.`.replace(
      /\s+/g,
      ' '
    )
  }

  getPartialMessage(chatId: number) {
    return this.#partialMessages.get(chatId)?.chunks ?? null
  }

  addBrowserWindow(window: BrowserWindow) {
    window.on('closed', () => this.removeBrowserWindow(window))
    this.#windows.add(window)
  }

  removeBrowserWindow(window: BrowserWindow) {
    this.#windows.delete(window)
  }

  /**
   * Abort the current message streaming for the given chat.
   *
   * This will persist the current message chunks and stop the streaming.
   *
   * @param chatId The ID of the chat to abort.
   */
  abortMessageForChat(chatId: number) {
    if (!this.#partialMessages.has(chatId)) {
      return
    }

    this.#completePartialMessage(chatId, {abort: true})
  }

  async sendMessage(message: Message, fns: FunctionController) {
    const chat = getChat(message.chatId)
    const systemMessage = chat.config?.systemMessage?.content
      ? ({
          role: 'system',
          content: chat.config.systemMessage.content
        } as const)
      : this.#systemMessage
    const model = chat.config?.model?.key ?? config.model.key

    // Includes the new message already.
    const [messageHistory, tokenCount, wasTruncated] =
      this.#truncateMessageHistory(config.model.key, [
        systemMessage,
        ...listMessages(message.chatId, {onlyServer: true})
      ])

    if (wasTruncated) {
      console.warn('Message history was truncated to', tokenCount)
    }

    console.debug('Sending message total size', tokenCount, 'tokens')

    if (this.#partialMessages.has(message.chatId)) {
      console.warn('Already streaming a message for chat', message.chatId)
      return
    }

    const partialMessage: PartialMessage = {
      abortController: new AbortController(),
      chunks: []
    }

    const allFns = await fns.loadFunctions()
    const completionFns = (chat.config?.functions ?? []).map(dir => {
      const completionFn = assert(
        allFns.find(fn => fn.dir === dir),
        `No function named "${dir}"`
      )
      return completionFn
    })

    function formatMessage(message: MessageBase): ChatCompletionMessageParam {
      const msg: ChatCompletionMessageParam = {
        role: message.role,
        content: message.content
      }

      if (message.name != null) {
        msg.name = message.name
      }

      if (message.function_call != null) {
        msg.function_call = message.function_call
      }

      return msg
    }

    const body: ChatCompletionCreateParamsBase = {
      model,
      max_tokens: REPLY_MAX_TOKENS,
      messages: messageHistory.map(formatMessage),
      temperature: chat.config?.temperature ?? config.temperature,
      stream: true
    }

    if (completionFns.length > 0) {
      body.functions = completionFns.map(c => ({
        name: c.name,
        description: c.description,
        parameters: c.parameters
      }))
    }

    // TODO: Handle no API key being set, yet.
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${assert(config.openAIAPIKey)}`
      },
      signal: partialMessage.abortController.signal,
      body: JSON.stringify(body)
    })

    if (!resp.ok) {
      let errorMessage: Message

      if (resp.headers.get('content-type')?.includes('application/json')) {
        const errorJson = await resp.json()
        errorMessage = createMessage(
          message.chatId,
          'system',
          `Received an error from the OpenAI API: \`${resp.status} ${
            resp.statusText
          }\`:
\`\`\`json
${JSON.stringify(errorJson, null, '\t')}
\`\`\`

Note: Do not respond to this error, the bot is not aware of it.`,
          {clientOnly: true}
        )
      } else {
        const errorText = await resp.text()
        errorMessage = createMessage(
          message.chatId,
          'system',
          `Received an error from the OpenAI API: \`${resp.status} ${resp.statusText}\`:
\`\`\`text
${errorText}
\`\`\`

Note: Do not respond to this error, the bot is not aware of it.`,
          {clientOnly: true}
        )
      }

      this.#windows.forEach(window => {
        window.webContents.send('chat:message', errorMessage)
      })

      return
    }

    const bodyReader = assert(resp.body).getReader()
    const decoder = new TextDecoder()

    let functionCall: FunctionChoice['delta']['function_call'] | null = null

    let didSetPartial = false

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let value: Uint8Array | undefined
      let done: boolean | undefined
      try {
        const read = await bodyReader.read()
        value = read.value
        done = read.done
      } catch (err) {
        if (partialMessage.abortController.signal.aborted) {
          return
        }
      }

      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk
        .split('\n\n')
        .map(line => line.slice('data: '.length).trim())
        .filter(Boolean)

      for (const line of lines) {
        if (line === '[DONE]') {
          break
        }

        const chunk = CompletionChunk.parse(JSON.parse(line))
        const choice = chunk.choices.at(0)

        if (choice && isContentChoice(choice)) {
          if (!didSetPartial) {
            this.#partialMessages.set(message.chatId, partialMessage)
            didSetPartial = true
          }

          partialMessage.chunks.push(choice.delta.content)

          this.#windows.forEach(window => {
            window.webContents.send(
              'chat:message-chunk',
              message.chatId,
              choice.delta.content
            )
          })
        }

        if (choice && isFunctionChoice(choice)) {
          if (!functionCall) {
            functionCall = {name: '', arguments: ''}
          }

          if (choice.delta.function_call.name) {
            functionCall.name = choice.delta.function_call.name
          }

          if (choice.delta.function_call.arguments) {
            functionCall.arguments += choice.delta.function_call.arguments
          }
        }
      }
    }

    if (functionCall) {
      const name = assert(functionCall.name)
      const args = JSON.parse(assert(functionCall.arguments))

      console.debug('invoke', name, 'with', functionCall.arguments)

      const result = await fns.invokeFunction(name, args, update => {
        const message = createMessage(chat.id, 'assistant', update, {
          clientOnly: true
        })

        this.#windows.forEach(window => {
          window.webContents.send('chat:message', message)
        })
      })

      const asstMsg = createMessage(chat.id, 'assistant', null, {
        name,
        function_call: {name, arguments: JSON.stringify(args)}
      })

      this.#windows.forEach(window => {
        window.webContents.send('chat:message', asstMsg)
      })

      const message2 = createMessage(
        chat.id,
        'function',
        JSON.stringify(result),
        {
          name
        }
      )

      this.#windows.forEach(window => {
        window.webContents.send('chat:message', message2)
      })

      await this.sendMessage(message2, fns)

      return
    }

    this.#completePartialMessage(message.chatId)
  }

  #completePartialMessage(chatId: number, opts: {abort?: boolean} = {}) {
    const partialMessage = assert(this.#partialMessages.get(chatId))
    this.#partialMessages.delete(chatId)

    if (opts.abort) {
      partialMessage?.abortController.abort()
    }

    const message = createMessage(
      chatId,
      'assistant',
      partialMessage?.chunks.join('')
    )

    this.#windows.forEach(window => {
      window.webContents.send('chat:message', message)
    })
  }

  #truncateMessageHistory(
    model: string,
    messages: MessageBase[]
  ): [messages: MessageBase[], tokenCount: number, wasTruncated: boolean] {
    const tokensPerMessage = model === 'gpt-4' ? 3 : 4
    const maxTokens = model.includes('gpt-4')
      ? gpt4maxSize
      : model.endsWith('16k')
      ? gpt3516kMaxSize
      : gpt35maxSize
    const encoding = model.includes('gpt-4') ? gpt4encoding : gpt35encoding
    const systemMessage = assert(
      messages.at(0),
      'No system message passed to #truncateMessageHistory'
    )

    let tokenCount = REPLY_MAX_TOKENS + 3 // Reply tokens, and reply primed with <|start|>assistant<|message|>.
    tokenCount +=
      encoding.encode(systemMessage.content ?? '').length + tokensPerMessage // System message

    const allowedMessages: MessageBase[] = []

    for (const message of messages.slice(1).reverse()) {
      const nextCount =
        encoding.encode(message.role).length +
        encoding.encode(message.name ?? '').length +
        encoding.encode(message.content ?? '').length +
        encoding.encode(message.function_call?.name ?? '').length +
        encoding.encode(message.function_call?.arguments ?? '').length +
        tokensPerMessage

      if (tokenCount + nextCount > maxTokens) {
        break
      }

      tokenCount += nextCount
      allowedMessages.unshift(message)
    }

    return [
      [systemMessage, ...allowedMessages],
      tokenCount - REPLY_MAX_TOKENS - 3,
      allowedMessages.length + 1 != messages.length
    ]
  }
}

function isContentChoice(
  choice: RoleChoice | ContentChoice | FunctionChoice | StopChoice
): choice is ContentChoice {
  return typeof Reflect.get(choice.delta, 'content') === 'string'
}

function isFunctionChoice(
  choice: RoleChoice | ContentChoice | FunctionChoice | StopChoice
): choice is FunctionChoice {
  return Reflect.has(choice.delta, 'function_call')
}
