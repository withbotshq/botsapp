import {APIDefinition, Event, Handler, Listener} from '../api'
import {config} from '../main/config/config'

export interface ConfigAPI extends APIDefinition {
  handlers: {
    'config:read:model': Handler<[], (typeof config)['model']>
    'config:read:openai-api-key': Handler<[], string | null>
  }

  listeners: {
    'config:write:model': Listener<[string]>
    'config:write:openai-api-key': Listener<[string]>
  }

  events: {
    'config:write:model': Event<[string]>
  }
}
