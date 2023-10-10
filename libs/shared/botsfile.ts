import {assert} from '@jclem/assert'
import decompress from 'decompress'
import {z} from 'zod'

export const BotsFile = z.object({
  version: z.literal('0.0.0'),
  model: z
    .object({
      key: z.string(),
      title: z.string()
    })
    .nullable(),
  temperature: z.number().min(0).max(2).nullable(),
  systemMessage: z
    .object({
      type: z.literal('text'),
      content: z.string()
    })
    .nullable()
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
