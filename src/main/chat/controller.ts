import {assert} from '@jclem/assert'
import {BrowserWindow} from 'electron'
import {z} from 'zod'
import {config} from '../config/config'
import {createMessage, listMessages} from '../db/db'
import {Message} from '../db/schema'

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

const CompletionChunk = z.object({
  id: z.string(),
  object: z.literal('chat.completion.chunk'),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.union([RoleChoice, ContentChoice, StopChoice]))
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

  readonly #systemMessage = {
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
      console.warn('No partial message to abort for chat', chatId)
      return
    }

    this.#completePartialMessage(chatId, {abort: true})
  }

  async sendMessage(message: Message) {
    // Includes the new message already.
    const messageHistory = [
      this.#systemMessage,
      ...listMessages(message.chatId, {onlyServer: true})
    ]

    if (this.#partialMessages.has(message.chatId)) {
      console.warn('Already streaming a message for chat', message.chatId)
      return
    }

    const partialMessage: PartialMessage = {
      abortController: new AbortController(),
      chunks: []
    }

    this.#partialMessages.set(message.chatId, partialMessage)

    // TODO: Handle no API key being set, yet.
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${assert(config.openAIAPIKey)}`
      },
      signal: partialMessage.abortController.signal,
      body: JSON.stringify({
        model: config.model.key,
        messages: messageHistory.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: 0.8,
        stream: true
      })
    })

    if (!resp.ok) {
      this.#partialMessages.delete(message.chatId)

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
        console.log('returning')
      }

      this.#windows.forEach(window => {
        window.webContents.send('chat:message', errorMessage)
      })

      return
    }

    const bodyReader = assert(resp.body).getReader()
    const decoder = new TextDecoder()

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
          partialMessage.chunks.push(choice.delta.content)

          this.#windows.forEach(window => {
            window.webContents.send(
              'chat:message-chunk',
              message.chatId,
              choice.delta.content
            )
          })
        }
      }
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
}

function isContentChoice(
  choice: RoleChoice | ContentChoice | StopChoice
): choice is ContentChoice {
  return Reflect.has(choice.delta, 'content')
}
