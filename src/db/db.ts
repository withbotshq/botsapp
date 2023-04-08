import Database from 'better-sqlite3'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import {desc, eq} from 'drizzle-orm/expressions'
import {app} from 'electron'
import path from 'path'
import {Chat, Message, chats, messages} from './schema'

const dbPath = path.join(app.getPath('userData'), 'data.db')
const nativeBindingPath = path.join(
  app.getAppPath(),
  'node_modules/better-sqlite3/build/Release/better_sqlite3'
)

const sqlite = new Database(dbPath, {
  verbose: console.log,
  nativeBinding: nativeBindingPath
})

const db = drizzle(sqlite)

export function runMigrations() {
  migrate(db, {migrationsFolder: path.join(app.getAppPath(), 'migrations')})
}

export function createChat(): Chat {
  return db.insert(chats).values(timestamps(true)).returning().get()
}

export function listChats(): Chat[] {
  return db.select().from(chats).orderBy(desc(chats.updatedAt)).all()
}

export function createMessage(chatId: number, content: string): Message {
  return db
    .insert(messages)
    .values({...timestamps(true), chatId, content})
    .returning()
    .get()
}

export function listMessages(chatId: number): Message[] {
  return db.select().from(messages).where(eq(messages.chatId, chatId)).all()
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
