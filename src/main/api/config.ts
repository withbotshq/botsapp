import {ConfigAPI} from '../../api/config'
import {createAPI} from '../api'
import {config, setModel, setOpenAIAPIKey} from '../config/config'

export function createConfigAPI() {
  return createAPI<ConfigAPI>({
    handlers: {
      'config:read:openai-api-key': () => config.openAIAPIKey,
      'config:read:model': () => config.model
    },

    listeners: {
      'config:write:openai-api-key': (event, key) => setOpenAIAPIKey(key),
      'config:write:model': (event, model) => setModel(model)
    }
  })
}
