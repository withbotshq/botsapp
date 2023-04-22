import {APIDefinition, Event, Handler} from '../api'
import {Message, MessageRole} from '../main/db/schema'

export interface MessagingAPI extends APIDefinition {
  handlers: {
    'messaging:send': Handler<[number, MessageRole, string], Message>
    'messaging:list': Handler<[number], Message[]>
    'messaging:read:partial': Handler<[number], string[]>
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listeners: {}

  events: {
    'messaging:chunk': Event<[number, string]>
    'messaging:message': Event<[Message]>
  }
}
