import {assert} from '@jclem/assert'
import {app} from 'electron'
import fs from 'fs'
import path from 'path'
import {Chat, Message} from './schema'

const dataPath = path.join(app.getPath('userData'), 'data')
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

export function createChat(): Chat {
  const chat: Chat = {
    id: databaseState.nextChatId,
    name: null,
    ...timestamps(true)
  }

  // First, update the database state.
  databaseState.nextChatId++
  writeDatabaseState(databaseState)

  // Next, write the chat state to disk.
  writeChatState(chat.id, {messages: []})

  // Finally, update the index.
  chatsIndex.chats.push(chat)
  writeChatsIndex(chatsIndex)

  return chat
}

export function listChats(): Chat[] {
  return chatsIndex.chats
}

export function createMessage(chatId: number, content: string): Message {
  const message: Message = {
    id: databaseState.nextMessageId,
    chatId,
    content,
    ...timestamps(true)
  }

  // First, update the database state.
  databaseState.nextMessageId++
  writeDatabaseState(databaseState)

  // Next, read the chat state from disk.
  const chatState = readChatState(chatId)

  // Next, update the chat state.
  chatState.messages.push(message)

  // Next, write the chat state to disk.
  writeChatState(chatId, chatState)

  // Finally, update the index.
  const chat = assert(chatsIndex.chats.find((chat) => chat.id === chatId))
  chat.updatedAt = message.createdAt
  writeChatsIndex(chatsIndex)

  return message
}

export function listMessages(chatId: number): Message[] {
  const chatState = readChatState(chatId)
  return chatState.messages
}

function timestamps(creating: true): {createdAt: Date; updatedAt: Date}
function timestamps(creating: false): {updatedAt: Date}
function timestamps(creating: boolean) {
  if (creating) {
    return {createdAt: new Date(), updatedAt: new Date()}
  } else {
    return {updatedAt: new Date()}
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

function readJSONFile(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function writeJSONFile(path: string, content: any): void {
  fs.writeFileSync(path, toJSON(content))
}

function toJSON(value: any): any {
  return JSON.stringify(value, null, '\t')
}
