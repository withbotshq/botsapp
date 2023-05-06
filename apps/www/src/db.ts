import {assert} from '@jclem/assert'
import {connect} from '@planetscale/database'
import {Message} from '@withbotshq/shared/schema'
import {InferModel, eq} from 'drizzle-orm'
import {
  bigint,
  datetime,
  mysqlTable,
  serial,
  text,
  varchar
} from 'drizzle-orm/mysql-core'
import {drizzle} from 'drizzle-orm/planetscale-serverless'
import {ulid} from 'ulid'

const conn = connect({
  host: assert(process.env['DATABASE_HOST']),
  username: assert(process.env['DATABASE_USERNAME']),
  password: assert(process.env['DATABASE_PASSWORD'])
})

const db = drizzle(conn)

const chats = mysqlTable('chats', {
  id: serial('id').primaryKey(),
  clientId: bigint('client_id', {mode: 'number'}).notNull(),
  uuid: varchar('uuid', {length: 26}).notNull(),
  name: varchar('name', {length: 64}).notNull(),
  insertedAt: datetime('inserted_at').notNull(),
  updatedAt: datetime('updated_at').notNull()
})

type ChatRecord = InferModel<typeof chats>

const messages = mysqlTable('messages', {
  id: serial('id').primaryKey(),
  clientId: bigint('client_id', {mode: 'number'}).notNull(),
  chatId: bigint('chat_id', {mode: 'number'}).notNull(),
  role: varchar('role', {length: 16}).notNull(),
  content: text('content').notNull(),
  insertedAt: datetime('inserted_at').notNull(),
  updatedAt: datetime('updated_at').notNull()
})

type MessageRecord = InferModel<typeof messages>

export async function createChat(
  name: string | null,
  chatId: number,
  messageHistory: Message[]
): Promise<string> {
  const now = new Date()
  const chatUUID = ulid()

  await db.transaction(async (tx) => {
    const {insertId} = await tx.insert(chats).values({
      name: name ?? 'Untitled chat',
      clientId: chatId,
      uuid: chatUUID,
      insertedAt: now,
      updatedAt: now
    })

    await tx.insert(messages).values(
      messageHistory.map((message) => ({
        clientId: message.id,
        chatId: parseInt(insertId),
        role: message.role,
        content: message.content,
        insertedAt: now,
        updatedAt: now
      }))
    )
  })

  return chatUUID
}

export async function deleteChat(chatUUID: string): Promise<void> {
  const chat = await getChatByUUID(chatUUID)

  await db.transaction(async (tx) => {
    await tx.delete(chats).where(eq(chats.uuid, chatUUID))
    await tx.delete(messages).where(eq(messages.chatId, chat.id))
  })
}

export async function createMessage(
  chatUUID: string,
  message: Message
): Promise<void> {
  const now = new Date()
  const chat = await getChatByUUID(chatUUID)

  await db.insert(messages).values({
    chatId: chat.id,
    clientId: message.id,
    role: message.role,
    content: message.content,
    insertedAt: now,
    updatedAt: now
  })
}

export async function getChatByUUID(uuid: string) {
  const selected = await db.select().from(chats).where(eq(chats.uuid, uuid))
  return assert(selected.at(0), 'no chat found')
}

export async function getChatMessagesByUUID(
  uuid: string
): Promise<MessageRecord[]> {
  const chatMessages = await db
    .select({messages})
    .from(messages)
    .innerJoin(chats, eq(messages.chatId, chats.id))
    .where(eq(chats.uuid, uuid))

  return chatMessages.map((m) => m.messages)
}
