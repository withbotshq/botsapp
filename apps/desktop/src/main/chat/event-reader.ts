// Events are delimited by double-newlines.
const eventDelimiter = '\n\n'

// Fields are always prefixed with "data: ".
const fieldPrefix = 'data: '

// The final event field data is always "[DONE]".
const doneFieldData = '[DONE]'

export async function* readEvents(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<unknown, {error: Error | null}> {
  const reader = stream
    .pipeThrough(new TextDecoderStream('utf-8', {fatal: true}))
    .getReader()

  let buffer = ''

  while (true) {
    let readResult: ReadableStreamReadResult<string>

    try {
      readResult = await reader.read()
    } catch (error) {
      if (error instanceof Error) {
        return {error}
      } else {
        return {error: new Error(String(error))}
      }
    }

    if (readResult.done) {
      return {error: null}
    }

    const parts = readResult.value.split(eventDelimiter)
    const readyParts = parts.slice(0, -1)
    const finalPart = parts.at(-1)

    for (const part of readyParts) {
      const line = (buffer + part).slice(fieldPrefix.length).trim()
      buffer = ''

      if (line === doneFieldData) {
        return {error: null}
      }

      const parsedLine = JSON.parse(line)

      yield parsedLine
    }

    buffer += finalPart
  }
}
