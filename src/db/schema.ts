import {InferModel} from 'drizzle-orm'
import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core'

export const chats = sqliteTable('chats', {
  id: integer('id').primaryKey(),
  name: text('name'),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull()
})

export type Chat = InferModel<typeof chats>

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  chatId: integer('chat_id')
    .references(() => chats.id)
    .notNull(),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull()
})

export type Message = InferModel<typeof messages>
