/* eslint-disable @typescript-eslint/no-unused-vars */
import {ChatAPI} from './api/chat'
import type {ConfigAPI} from './api/config'
import {MessagingAPI} from './api/messaging'
import {UIAPI} from './api/ui'

export type APIType = ChatAPI & ConfigAPI & MessagingAPI & UIAPI

export type APIDefinition = {
  handlers: Record<string, Handler<unknown[], unknown>>
  listeners: Record<string, Listener<unknown[]>>
  events: Record<string, Event<unknown[]>>
}

export type Handler<Args extends unknown[], Result> = Record<string, never>
export type Listener<Args extends unknown[]> = Record<string, never>
export type Event<Payload extends unknown[]> = Record<string, never>

export type ListenerChannel = keyof APIType['listeners']
export type HandlerChannel = keyof APIType['handlers']
export type EventChannel = keyof APIType['events']
export type SpecificListener<K extends ListenerChannel> =
  APIType['listeners'][K]
export type SpecificHandler<K extends HandlerChannel> = APIType['handlers'][K]
export type SpecificEvent<K extends EventChannel> = APIType['events'][K]
