import {assert} from '@jclem/assert'
import {Result, resultErr, resultOk} from '@jclem/result'
import {ChatCompletionCreateParams} from 'openai/resources'
import {z} from 'zod'

type CompletionOpts = {
  key: string
}

// Events are delimited by double-newlines.
const eventDelimiter = '\n\n'

// Fields are always prefixed with "data: ".
const fieldPrefix = 'data: '

// The final event field data is always "[DONE]".
const doneFieldData = '[DONE]'

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

const CompletionChunkError = z.object({
  error: z.object({
    message: z.string(),
    type: z.string()
  })
})

type CompletionChunkError = z.infer<typeof CompletionChunkError>

/**
 * An error returned when the OpenAI API returns an error.
 */
export class OpenAIAPIError extends Error {
  constructor(
    message: string,
    readonly response: Response
  ) {
    super(message)
  }
}

/**
 * An error returned mid-OpenAI stream.
 */
export class OpenAIStreamError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export async function* createChatCompletion(
  params: ChatCompletionCreateParams,
  opts: CompletionOpts
): AsyncGenerator<
  Result<
    | {type: 'content'; content: string}
    | {type: 'function'; name: string; args: unknown},
    OpenAIAPIError | OpenAIStreamError | Error
  >
> {
  // Make request.
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.key}`
    },
    body: JSON.stringify(params)
  })

  // Handle non-OK responses.
  if (!resp.ok) {
    let apiError: OpenAIAPIError

    if (resp.headers.get('content-type')?.includes('application/json')) {
      const errorJSON = await resp.json()
      apiError = new OpenAIAPIError(errorJSON, resp)
    } else {
      const errorText = await resp.text()
      apiError = new OpenAIAPIError(errorText, resp)
    }

    yield resultErr(apiError)
  }

  // Read response stream and parse out SSE events.
  const reader = assert(resp.body, 'No response body on OpenAI response')
    .pipeThrough(new TextDecoderStream('utf-8', {fatal: true}))
    .getReader()

  // The reader doesn't read by line, so we have to buffer the events in case we
  // read a partial event.
  let eventBuffer = ''

  let fnCall: {name: string; arguments: string} | null = null

  while (true) {
    let readResult: ReadableStreamReadResult<string>

    try {
      readResult = await reader.read()
    } catch (err) {
      if (err instanceof Error) {
        yield resultErr(err)
      } else {
        yield resultErr(new Error(String(err)))
      }

      return
    }

    if (readResult.done) {
      break
    }

    const parts = readResult.value.split(eventDelimiter)
    const readyParts = parts.slice(0, -1)
    const finalPart = parts.at(-1)

    for (const part of readyParts) {
      const line = (eventBuffer + part).slice(fieldPrefix.length).trim()
      eventBuffer = ''

      if (line === doneFieldData) {
        break
      }

      const parsedLine = JSON.parse(line)
      const parsedChunk = CompletionChunk.safeParse(parsedLine)

      if (!parsedChunk.success) {
        const parsedError = CompletionChunkError.parse(parsedLine)
        yield resultErr(new OpenAIStreamError(parsedError.error.message))
        return
      }

      const choice = assert(
        parsedChunk.data.choices.at(0),
        'No choice in OpenAI response stream'
      )

      const content = ContentChoice.safeParse(choice)
      if (content.success) {
        yield resultOk({
          type: 'content',
          content: content.data.delta.content
        })
        continue
      }

      const fn = FunctionChoice.safeParse(choice)
      if (fn.success) {
        fnCall = fnCall ?? {name: '', arguments: ''}
        fnCall.name = fn.data.delta.function_call.name ?? fnCall.name
        fnCall.arguments += fn.data.delta.function_call.arguments ?? ''
      }
    }

    eventBuffer += finalPart
  }

  if (fnCall != null) {
    const name = fnCall.name
    const args = JSON.parse(fnCall.arguments)

    yield resultOk({type: 'function', name, args})
  }
}
