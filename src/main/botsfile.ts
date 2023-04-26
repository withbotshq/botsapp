import {assert} from '@jclem/assert'
import decompress from 'decompress'
import {z} from 'zod'

export const BotsFile = z.object({
  version: z.string(),
  model: z.union([z.literal('gpt-3.5-turbo'), z.literal('gpt-4')]),
  systemMessage: z.object({
    type: z.literal('text'),
    content: z.string()
  })
})
export type BotsFile = z.infer<typeof BotsFile>

export async function botfileFromPath(path: string): Promise<BotsFile> {
  const files = await decompress(path)

  const botJson = JSON.parse(
    assert(
      files.find(file => file.path === 'bot.json' && file.type === 'file'),
      'No bot.json file found'
    ).data.toString('utf8')
  )

  return BotsFile.parse(botJson)
}
