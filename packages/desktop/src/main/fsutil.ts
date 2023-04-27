import fs from 'fs'

/**
 * Convert `value` to JSON.
 *
 * This ensures we always use the same on-disk formatting, which is
 * human-readable.
 *
 * @param value The value to be converted to JSON
 * @returns A JSON string
 */
export function toJSON(value: unknown): string {
  return JSON.stringify(value, null, '\t')
}

/**
 * Read a JSON file from disk.
 *
 * @param path The path to read the file from
 * @returns Returns the parsed JSON file
 */
export function readJSONFile(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

/**
 * Write an object to disk as JSON.
 *
 * @param path The path to write the file to
 * @param content The content to write to the file
 * @returns The content that was written to the file
 */
export function writeJSONFile<T = unknown>(path: string, content: T): T {
  fs.writeFileSync(path, toJSON(content))
  return content
}
