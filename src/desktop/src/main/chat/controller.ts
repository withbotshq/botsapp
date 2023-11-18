import {assert} from '@jclem/assert'
import {
  OpenAIAPIError,
  OpenAIStreamError,
  createChatCompletion
} from '../../../../openai/openai'
import {Message, MessageBase} from '../../../../shared/schema'
import {BrowserWindow} from 'electron'
import {TiktokenModel, encodingForModel} from 'js-tiktoken'
import {functionsTokensEstimate} from 'openai-chat-tokens'
import {
  ChatCompletionCreateParamsBase,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions'
import {z} from 'zod'
import {config} from '../config/config'
import {createMessage, getChat, listMessages} from '../db/db'
import {FunctionController} from './function-controller'

const gpt35maxSize = 4096
const gpt3516kMaxSize = 16384
const gpt4maxSize = 8192
const gpt4turboMaxSize = 128_000
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

    console.debug('Responding to message', message.id, 'with model', model)

    const allFns = await fns.loadFunctions()
    const completionFns = (chat.config?.functions ?? []).map(dir => {
      const completionFn = assert(
        allFns.find(fn => fn.dir === dir),
        `No function named "${dir}"`
      )
      return completionFn
    })

    let consumedTokens = 0
    if (completionFns.length > 0) {
      consumedTokens = functionsTokensEstimate(completionFns)
    }

    // Includes the new message already.
    const [messageHistory, tokenCount, wasTruncated] =
      this.#truncateMessageHistory(
        chat.config?.model?.key ?? config.model.key,
        [systemMessage, ...listMessages(message.chatId, {onlyServer: true})],
        consumedTokens
      )

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

    console.debug('MESSAGES: ', JSON.stringify(body.messages, null, '\t'))

    const result = createChatCompletion(body, {
      key: assert(config.openAIAPIKey)
    })

    let didSetPartial = false

    for await (const part of result) {
      if (!part.ok && part.error instanceof OpenAIAPIError) {
        this.#handleAPIError(part.error, message)
        return
      } else if (!part.ok && part.error instanceof OpenAIStreamError) {
        this.#handleStreamError(part.error, message)
        return
      } else if (!part.ok && part.error.name === 'AbortError') {
        console.debug('Aborted message for chat', message.chatId)
        return
      } else if (!part.ok) {
        throw part.error
      }

      if (part.value.type === 'content') {
        const content = part.value.content

        partialMessage.chunks.push(content)

        if (!didSetPartial) {
          this.#partialMessages.set(message.chatId, partialMessage)
          didSetPartial = true
        }

        this.#windows.forEach(window => {
          window.webContents.send('chat:message-chunk', message.chatId, content)
        })
      }

      if (part.value.type === 'function') {
        const {name, args} = part.value
        console.debug('invoke', name, 'with', JSON.stringify(args, null, '\t'))
        const result = await fns.invokeFunction(name, args, update => {
          const message = createMessage(chat.id, 'assistant', update, {
            clientOnly: true
          })

          this.#windows.forEach(window => {
            window.webContents.send('chat:message', message)
          })
        })

        console.debug(
          'Got a result, which is',
          this.#countTokens(model, JSON.stringify(result)),
          'tokens.'
        )

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
      }
    }

    if (this.#partialMessages.has(message.chatId)) {
      this.#completePartialMessage(message.chatId)
    }
  }

  #handleAPIError(err: OpenAIAPIError, message: Message) {
    let errHighlightLang = 'text'
    if (
      err.response.headers.get('content-type')?.includes('application/json')
    ) {
      errHighlightLang = 'json'
    }

    const errorMessage = createMessage(
      message.chatId,
      'system',
      `Received an error from the OpenAI API: \`${err.response.status} ${
        err.response.statusText
      }\`:
\`\`\`${errHighlightLang}
${JSON.stringify(err.message, null, '\t')}
\`\`\`

Note: Do not respond to this error, the bot is not aware of it.`,
      {clientOnly: true}
    )

    this.#windows.forEach(window => {
      window.webContents.send('chat:message', errorMessage)
    })

    return
  }

  #handleStreamError(err: OpenAIStreamError, message: Message) {
    const errorMessage = createMessage(
      message.chatId,
      'system',
      `Received an error from OpenAI:
\`\`\`text
${err.message}
\`\`\`

Note: Do not respond to this error, the bot is not aware of it.`,
      {clientOnly: true}
    )

    this.#windows.forEach(window => {
      window.webContents.send('chat:message', errorMessage)
    })
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

  #countTokens(model: string, text: string): number {
    const encoding = encodingForModel(model as TiktokenModel)
    const tokenCount = encoding.encode(text).length
    return tokenCount
  }

  #truncateMessageHistory(
    model: string,
    messages: MessageBase[],
    consumedTokens: number
  ): [messages: MessageBase[], tokenCount: number, wasTruncated: boolean] {
    const tokensPerMessage = model === 'gpt-4' ? 3 : 4
    const maxTokens =
      model === 'gpt-4-1106-preview'
        ? gpt4turboMaxSize
        : model.includes('gpt-4')
          ? gpt4maxSize
          : model.endsWith('16k')
            ? gpt3516kMaxSize
            : gpt35maxSize
    console.debug(
      'Truncating history from max tokens',
      maxTokens,
      'for model',
      model
    )
    const encoding = encodingForModel(model as TiktokenModel)
    const systemMessage = assert(
      messages.at(0),
      'No system message passed to #truncateMessageHistory'
    )

    let tokenCount = REPLY_MAX_TOKENS + 3 // Reply tokens, and reply primed with <|start|>assistant<|message|>.
    tokenCount +=
      consumedTokens +
      encoding.encode(systemMessage.content ?? '').length +
      tokensPerMessage // System message

    console.debug(
      'Max tokens:',
      maxTokens,
      'Remaining:',
      maxTokens - tokenCount
    )

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
        console.debug(
          'Max tokens:',
          maxTokens,
          'Remaining:',
          maxTokens - tokenCount,
          'Stopping with oversized message:',
          nextCount,
          'Message:',
          message
        )

        break
      }

      console.debug(
        'Max tokens:',
        maxTokens,
        'Remaining:',
        maxTokens - tokenCount
      )

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
