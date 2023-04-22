import {APIDefinition, Event, Handler, Listener} from '../api'
import {Chat} from '../main/db/schema'

export interface ChatAPI extends APIDefinition {
  handlers: {
    'chat:create': Handler<[], Chat>
    'chat:list': Handler<[], Chat[]>
    'chat:rename': Handler<[number, string | null], void>
  }

  listeners: {
    'chat:stop': Listener<[number]>
  }

  events: {
    'chat:create': Event<[Chat]>
    'chat:delete': Event<[number]>
    'chat:rename': Event<[number]>
    'chat:stop': Event<[]>
  }
}
