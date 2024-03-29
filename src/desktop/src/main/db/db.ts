import {assert} from '@jclem/assert'
import {BotsFile} from '@withbotshq/shared/botsfile'
import {Chat, Message, VisibleMessage} from '@withbotshq/shared/schema'
import {app} from 'electron'
import fs from 'fs'
import path from 'path'
import {isValidModel, modelTitles} from '../config/config'
import {readJSONFile, toJSON, writeJSONFile} from '../fsutil'

export const dataPath = path.join(app.getPath('userData'), 'data')
const databaseStatePath = path.join(dataPath, 'database.json')
const chatsIndexPath = path.join(dataPath, 'chats.json')
const chatStatesPath = path.join(dataPath, 'chats')

if (!fs.existsSync(dataPath)) {
  const initialDatabaseState: DatabaseState = {
    version: 0,
    nextChatId: 1,
    nextMessageId: 1
  }

  const initialChatsIndex: ChatsIndex = {
    chats: []
  }

  fs.mkdirSync(dataPath)
  fs.writeFileSync(databaseStatePath, toJSON(initialDatabaseState))
  fs.writeFileSync(chatsIndexPath, toJSON(initialChatsIndex))
  fs.mkdirSync(chatStatesPath)
}

interface DatabaseState {
  version: number
  nextChatId: number
  nextMessageId: number
}

interface ChatsIndex {
  chats: Chat[]
}

interface ChatState {
  messages: Message[]
}

const databaseState = readJSONFile(databaseStatePath) as DatabaseState
const chatsIndex = readJSONFile(chatsIndexPath) as ChatsIndex

export function runMigrations() {
  return
}

export function createChat({config}: {config?: BotsFile} = {}): Chat {
  const chat: Chat = {
    id: getNextChatId(),
    name: null,
    config: config ?? {
      version: '0.0.0',
      model: null,
      systemMessage: null,
      temperature: null,
      functions: null
    },
    ...timestamps(true)
  }

  // First, write the chat state to disk.
  writeChatState(chat.id, {messages: []})

  // Finally, update the index.
  chatsIndex.chats.push(chat)
  writeChatsIndex(chatsIndex)

  return chat
}

export function renameChat(chatId: number, name: string | null): void {
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  chat.name = name
  Object.assign(chat, timestamps(false))
  writeChatsIndex(chatsIndex)
}

export function setChatModel(chatId: number, model: string | null): void {
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  const chatConfig: BotsFile = chat.config ?? {
    version: '0.0.0',
    functions: [],
    model: null,
    systemMessage: null,
    temperature: null
  }

  Object.assign(chat, timestamps(false))

  if (model === null) {
    chatConfig.model = null
  } else {
    if (!isValidModel(model)) {
      throw new Error(`Invalid model: ${model}`)
    }

    chatConfig.model = {
      key: model,
      title: modelTitles[model]
    }
  }

  chat.config = chatConfig

  writeChatsIndex(chatsIndex)
}

export function setChatSystemMessage(chatId: number, content: string | null) {
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  const chatConfig: BotsFile = chat.config ?? {
    version: '0.0.0',
    functions: [],
    model: null,
    systemMessage: null,
    temperature: null
  }

  Object.assign(chat, timestamps(false))

  if (content === null) {
    chatConfig.systemMessage = null
  } else {
    chatConfig.systemMessage = {
      type: 'text',
      content
    }
  }

  chat.config = chatConfig

  writeChatsIndex(chatsIndex)
}

export function toggleChatFunction(
  chatId: number,
  dir: string,
  enabled: boolean
) {
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  const chatConfig: BotsFile = chat.config ?? {
    version: '0.0.0',
    functions: [],
    model: null,
    systemMessage: null,
    temperature: null
  }

  Object.assign(chat, timestamps(false))

  if (!chatConfig.functions) {
    chatConfig.functions = []
  }

  if (enabled) {
    chatConfig.functions.push(dir)
  } else {
    chatConfig.functions = chatConfig.functions.filter(f => f !== dir)
  }

  chat.config = chatConfig

  writeChatsIndex(chatsIndex)
}

export function setChatTemperature(chatId: number, temperature: number | null) {
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  const chatConfig: BotsFile = chat.config ?? {
    version: '0.0.0',
    functions: [],
    model: null,
    systemMessage: null,
    temperature: null
  }

  Object.assign(chat, timestamps(false))

  chatConfig.temperature = temperature

  chat.config = chatConfig

  writeChatsIndex(chatsIndex)
}

export function listChats(): Chat[] {
  return [...chatsIndex.chats].sort((a, b) => b.createdAt - a.createdAt)
}

export function getChat(id: number): Chat {
  return assert(chatsIndex.chats.find(chat => chat.id === id))
}

export function deleteChat(chatId: number): void {
  // First, delete the chat state from disk.
  fs.unlinkSync(path.join(chatStatesPath, `${getChatIdString(chatId)}.json`))

  // Next, update the index.
  chatsIndex.chats = chatsIndex.chats.filter(chat => chat.id !== chatId)
  writeChatsIndex(chatsIndex)
}

export function clearChatHistory(chatId: number): void {
  // First, read the chat state from disk.
  const chatState = readChatState(chatId)

  // Next, update the chat state.
  chatState.messages = []

  // Next, write the chat state to disk.
  writeChatState(chatId, chatState)

  // Finally, update the index.
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  chat.updatedAt = Date.now()
  writeChatsIndex(chatsIndex)
}

export function createMessage(
  chatId: number,
  role: 'user' | 'assistant' | 'system' | 'function',
  content: string | null,
  opts: {
    clientOnly?: boolean
    name?: string
    function_call?: {name: string; arguments: string}
  } = {}
): Message {
  const message: Message = {
    id: getNextMessageId(),
    role,
    name: opts.name,
    chatId,
    content,
    function_call: opts.function_call,
    clientOnly: opts.clientOnly ?? false,
    ...timestamps(true)
  }

  // First, read the chat state from disk.
  const chatState = readChatState(chatId)

  // Next, update the chat state.
  chatState.messages.push(message)

  // Next, write the chat state to disk.
  writeChatState(chatId, chatState)

  // Finally, update the index.
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  chat.updatedAt = message.createdAt
  writeChatsIndex(chatsIndex)

  return message
}

export function listMessages(
  chatId: number,
  opts: {onlyServer?: boolean} = {}
): Message[] {
  const chatState = readChatState(chatId)

  if (opts.onlyServer) {
    return chatState.messages.filter(message => !message.clientOnly)
  }

  return chatState.messages
}

export function listVisibleMessages(
  chatId: number,
  opts: {onlyServer?: boolean} = {}
): VisibleMessage[] {
  const chatState = readChatState(chatId)
  const messages = chatState.messages.filter(isVisibleMessage)

  if (opts.onlyServer) {
    return messages.filter(message => !message.clientOnly)
  }

  return messages
}

export function deleteMessage(chatId: number, messageId: number): void {
  // First, read the chat state from disk.
  const chatState = readChatState(chatId)

  // Next, update the chat state.
  chatState.messages = chatState.messages.filter(
    message => message.id !== messageId
  )

  // Next, write the chat state to disk.
  writeChatState(chatId, chatState)

  // Finally, update the index.
  const chat = assert(chatsIndex.chats.find(chat => chat.id === chatId))
  chat.updatedAt = Date.now()
  writeChatsIndex(chatsIndex)
}

function timestamps(creating: true): {createdAt: number; updatedAt: number}
function timestamps(creating: false): {updatedAt: number}
function timestamps(creating: boolean) {
  if (creating) {
    return {createdAt: Date.now(), updatedAt: Date.now()}
  } else {
    return {updatedAt: Date.now()}
  }
}

function writeChatState(chatId: number, state: ChatState): ChatState {
  writeJSONFile(
    path.join(chatStatesPath, `${getChatIdString(chatId)}.json`),
    state
  )
  return state
}

function readChatState(chatId: number): ChatState {
  return readJSONFile(
    path.join(chatStatesPath, `${getChatIdString(chatId)}.json`)
  ) as ChatState
}

function writeDatabaseState(state: DatabaseState): DatabaseState {
  writeJSONFile(databaseStatePath, state)
  return state
}

function writeChatsIndex(state: ChatsIndex): ChatsIndex {
  writeJSONFile(chatsIndexPath, state)
  return state
}

function getChatIdString(id: number): string {
  return id.toString().padStart(4, '0')
}

function getNextChatId(): number {
  const nextId = databaseState.nextChatId
  databaseState.nextChatId++
  writeDatabaseState(databaseState)
  return nextId
}

function getNextMessageId(): number {
  const nextId = databaseState.nextMessageId
  databaseState.nextMessageId++
  writeDatabaseState(databaseState)
  return nextId
}

function isVisibleMessage(m: Message): m is VisibleMessage {
  return m.role !== 'function' && m.content != null
}
