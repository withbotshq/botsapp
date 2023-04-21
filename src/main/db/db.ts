import {assert} from '@jclem/assert'
import {app} from 'electron'
import fs from 'fs'
import path from 'path'
import {readJSONFile, toJSON, writeJSONFile} from '../fsutil'
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
    id: getNextChatId(),
    name: null,
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
  writeChatsIndex(chatsIndex)
}

export function listChats(): Chat[] {
  return [...chatsIndex.chats].sort((a, b) => b.createdAt - a.createdAt)
}

export function deleteChat(chatId: number): void {
  // First, delete the chat state from disk.
  fs.unlinkSync(path.join(chatStatesPath, `${getChatIdString(chatId)}.json`))

  // Next, update the index.
  chatsIndex.chats = chatsIndex.chats.filter(chat => chat.id !== chatId)
  writeChatsIndex(chatsIndex)
}

export function createMessage(
  chatId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  opts: {clientOnly?: boolean} = {}
): Message {
  const message: Message = {
    id: getNextMessageId(),
    role,
    chatId,
    content,
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
