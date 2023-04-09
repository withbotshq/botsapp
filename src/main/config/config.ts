import {app} from 'electron'
import fs from 'fs'
import path from 'path'
import z from 'zod'
import {readJSONFile, writeJSONFile} from '../fsutil'

const Config = z.object({
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

function readUserConfig(): Config {
  if (fs.existsSync(configPath)) {
    return Config.parse(readJSONFile(configPath))
  } else {
    return writeUserConfig({openAIAPIKey: null})
  }
}

function writeUserConfig(config: Config): Config {
  return writeJSONFile(configPath, config)
}
