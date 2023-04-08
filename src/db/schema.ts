import {InferModel} from 'drizzle-orm'
import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core'

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey(),
  name: text('name'),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull()
})

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey(),
  content: text('content').notNull(),
  conversationId: integer('conversation_id')
    .references(() => conversations.id)
    .notNull(),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull(),
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull()
})

export type Message = InferModel<typeof messages>
