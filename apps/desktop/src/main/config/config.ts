import {app} from 'electron'
import fs from 'fs'
import path from 'path'
import z from 'zod'
import {readJSONFile, writeJSONFile} from '../fsutil'

export const modelTitles = {
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo (16k)',
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
  temperature: z.number().min(0).max(2).default(0.8),
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

export function isValidModel(model: string): model is keyof typeof modelTitles {
  return Object.keys(modelTitles).includes(model)
}

export function setModel(model: string): void {
  if (!isValidModel(model)) {
    throw new Error(`Invalid model: ${model}`)
  }

  globalConfig.model.key = model
  globalConfig.model.title = modelTitles[model]
  writeUserConfig(config)
}

export function setTemperature(temperature: number): void {
  globalConfig.temperature = temperature
  writeUserConfig(config)
}

function readUserConfig(): Config {
  if (fs.existsSync(configPath)) {
    return Config.parse(readJSONFile(configPath))
  } else {
    return writeUserConfig({
      version: 0,
      openAIAPIKey: null,
      temperature: 0.8,
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
