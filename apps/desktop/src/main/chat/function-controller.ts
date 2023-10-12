import fs from 'node:fs/promises'
import {Dirent} from 'node:original-fs'
import path from 'node:path'
import {z} from 'zod'

const CompletionFunction = z.object({
  dir: z.string(),
  path: z.string(),
  description: z.string().optional(),
  name: z.string(),
  parameters: z.object({
    type: z.literal('object'),
    properties: z.record(z.string(), z.any())
  })
})

export type CompletionFunction = z.infer<typeof CompletionFunction>

declare const __non_webpack_require__: NodeRequire

export class FunctionController {
  readonly #basePath: string

  #functions: CompletionFunction[] = []
  #loadedFunctions = false

  constructor(basePath: string) {
    this.#basePath = basePath
  }

  async invokeFunction(
    name: string,
    args: unknown,
    callback: (msg: string) => void
  ): Promise<unknown> {
    const functions = await this.loadFunctions()
    const fn = functions.find(fn => fn.dir === name)

    if (!fn) {
      throw new Error(`No function named "${name}"`)
    }

    const mod = __non_webpack_require__(fn.path)
    delete __non_webpack_require__.cache[fn.path] // Ensure we get a fresh copy each time (in case the function is being actively developed)
    return mod.handler(args, callback)
  }

  async loadFunctions(): Promise<CompletionFunction[]> {
    // The base path is a list of directories, each with a "package.json" at the
    // root. Skip any without "package.json". Read the package.jsons, which have
    // "name", "description", and "parameters" fields.

    if (this.#loadedFunctions) {
      return this.#functions
    }

    let dirs: Dirent[]
    try {
      dirs = await fs.readdir(this.#basePath, {withFileTypes: true})
    } catch (err) {
      console.warn('No functions directory found', err)
      dirs = []
    }

    this.#functions = await Promise.all(
      dirs
        .filter(dir => dir.isDirectory)
        .filter(dir => !dir.name.startsWith('.'))
        .map(async dir => {
          const packageJsonPath = path.join(
            this.#basePath,
            dir.name,
            'package.json'
          )
          const packageJson = JSON.parse(
            await fs.readFile(packageJsonPath, 'utf8')
          )

          return CompletionFunction.parse({
            dir: dir.name,
            path: path.join(this.#basePath, dir.name),
            description: packageJson.description,
            name: packageJson.name,
            parameters: packageJson.parameters
          })
        })
    )

    this.#loadedFunctions = true

    return this.#functions
  }
}
