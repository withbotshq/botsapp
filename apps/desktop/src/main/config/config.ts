import {app} from 'electron'
import fs from 'fs'
import path from 'path'
import z from 'zod'
import {readJSONFile, writeJSONFile} from '../fsutil'

const modelTitles: Record<string, string | undefined> = {
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'gpt-4': 'GPT-4'
}

const Config = z.object({
  version: z.literal(0).default(0),
  model: z
    .object({
      key: z.string(),
      title: z.string()
    })
    .default({key: 'gpt-3.5-turbo', title: 'GPT-3.5 Turbo'}),
  openAIAPIKey: z.preprocess(
    v => (typeof v === 'string' ? v : null),
    z.string().nullable()
  )
})

type Config = z.infer<typeof Config>

const configPath = path.join(app.getPath('userData'), 'config.json')
const globalConfig: Config = readUserConfig()

export const config: Readonly<Config> = globalConfig

export function setOpenAIAPIKey(key: string): void {
  globalConfig.openAIAPIKey = key
  writeUserConfig(config)
}

export function setModel(model: string): void {
  const modelTitle = modelTitles[model]
  if (!modelTitle) throw new Error(`Invalid model: ${model}`)
  globalConfig.model.key = model
  globalConfig.model.title = modelTitle
  writeUserConfig(config)
}

function readUserConfig(): Config {
  if (fs.existsSync(configPath)) {
    return Config.parse(readJSONFile(configPath))
  } else {
    return writeUserConfig({
      version: 0,
      openAIAPIKey: null,
      model: {
        key: 'gpt-3.5-turbo',
        title: 'GPT-3.5 Turbo'
      }
    })
  }
}

function writeUserConfig(config: Config): Config {
  return writeJSONFile(configPath, config)
}
