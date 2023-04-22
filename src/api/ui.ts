import {APIDefinition, Event, Listener} from '../api'

export interface UIAPI extends APIDefinition {
  // eslint-disable-next-line @typescript-eslint/ban-types
  handlers: {}

  listeners: {
    'ui:chats:show-context': Listener<[number]>
  }

  events: {
    'ui:chats:focus-next': Event<[number]>
    'ui:chats:focus-previous': Event<[number]>
  }
}
