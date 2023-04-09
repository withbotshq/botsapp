import {assert} from '@jclem/assert'
import {BrowserWindow} from 'electron'
import {z} from 'zod'
import {listMessages} from '../../db/db'
import {Message} from '../../db/schema'
import {config} from '../config/config'

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

export class ChatController {
  #abortController: AbortController | null = null

  abortMessage() {
    this.#abortController?.abort()
  }

  async sendMessage(message: Message, window: BrowserWindow) {
    // Includes the new message already.
    const messageHistory = listMessages(message.chatId)

    this.#abortController = new AbortController()

    // TODO: Handle no API key being set, yet.
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${assert(config.openAIAPIKey)}`
      },
      signal: this.#abortController.signal,
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messageHistory.map((m) => ({
          role: m.role,
          content: m.content
        })),
        temperature: 0.8,
        stream: true
      })
    })

    if (!resp.ok) {
      throw new Error(
        `OpenAI API error: ${resp.statusText} ${await resp.text()}`
      )
    }

    const bodyReader = assert(resp.body).getReader()
    const decoder = new TextDecoder()

    const chunks = []

    while (true) {
      const {value, done} = await bodyReader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk
        .split('\n\n')
        .map((line) => line.slice('data: '.length).trim())
        .filter(Boolean)

      for (const line of lines) {
        if (line === '[DONE]') {
          break
        }

        const chunk = CompletionChunk.parse(JSON.parse(line))
        const choice = chunk.choices.at(0)

        if (choice && isContentChoice(choice)) {
          chunks.push(choice.delta.content)
          window.webContents.send('chat:message-chunk', choice.delta.content)
        }
      }
    }
  }
}

function isRoleChoice(
  choice: RoleChoice | ContentChoice | StopChoice
): choice is RoleChoice {
  return choice.delta.hasOwnProperty('role')
}

function isContentChoice(
  choice: RoleChoice | ContentChoice | StopChoice
): choice is ContentChoice {
  return choice.delta.hasOwnProperty('content')
}

function isStopChoice(
  choice: RoleChoice | ContentChoice | StopChoice
): choice is StopChoice {
  return choice.finish_reason !== null
}
