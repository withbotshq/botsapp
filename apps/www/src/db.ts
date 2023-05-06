import {assert, assertEquals} from '@jclem/assert'
import {connect} from '@planetscale/database'
import {Chat, Message} from '@withbotshq/shared/schema'
import {InferModel, and, eq} from 'drizzle-orm'
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
  clientID: bigint('client_id', {mode: 'number'}).notNull(),
  uuid: varchar('uuid', {length: 26}).notNull(),
  name: varchar('name', {length: 64}).notNull(),
  insertedAt: datetime('inserted_at').notNull(),
  updatedAt: datetime('updated_at').notNull()
})

type ChatRecord = InferModel<typeof chats>

const messages = mysqlTable('messages', {
  id: serial('id').primaryKey(),
  clientID: bigint('client_id', {mode: 'number'}).notNull(),
  chatID: bigint('chat_id', {mode: 'number'}).notNull(),
  role: varchar('role', {length: 16}).notNull(),
  content: text('content').notNull(),
  insertedAt: datetime('inserted_at').notNull(),
  updatedAt: datetime('updated_at').notNull()
})

type MessageRecord = InferModel<typeof messages>

export async function createChat(
  chat: Chat,
  messageHistory: Message[]
): Promise<string> {
  const now = new Date()
  const chatUUID = ulid()

  await db.transaction(async (tx) => {
    const {insertId} = await tx.insert(chats).values({
      name: chat.name ?? 'Untitled chat',
      clientID: chat.id,
      uuid: chatUUID,
      insertedAt: now,
      updatedAt: now
    })

    if (messageHistory.length === 0) {
      return
    }

    await tx.insert(messages).values(
      messageHistory.map((message) => ({
        clientID: message.id,
        chatID: parseInt(insertId),
        role: message.role,
        content: message.content,
        insertedAt: now,
        updatedAt: now
      }))
    )
  })

  return chatUUID
}

export async function updateChat(
  chatClientID: number,
  chatUpdate: Pick<Chat, 'name'>
): Promise<void> {
  const chat = await getChatByClientID(chatClientID)

  await db
    .update(chats)
    .set({
      name: chatUpdate.name ?? 'Untitled chat'
    })
    .where(eq(chats.clientID, chatClientID))
}

export async function deleteChat(chatClientID: number): Promise<void> {
  const chat = await getChatByClientID(chatClientID)

  await db.transaction(async (tx) => {
    await tx.delete(chats).where(eq(chats.clientID, chatClientID))
    await tx.delete(messages).where(eq(messages.chatID, chat.id))
  })
}

export async function createMessage(
  chatClientID: number,
  message: Message
): Promise<void> {
  const now = new Date()
  const chat = await getChatByClientID(chatClientID)

  await db.insert(messages).values({
    chatID: chat.id,
    clientID: message.id,
    role: message.role,
    content: message.content,
    insertedAt: now,
    updatedAt: now
  })
}

export async function deleteMessage(
  chatClientID: number,
  messageClientID: number
): Promise<void> {
  const chat = await getChatByClientID(chatClientID)

  const result = await db
    .delete(messages)
    .where(
      and(eq(messages.chatID, chat.id), eq(messages.clientID, messageClientID))
    )

  assertEquals(result.rowsAffected, 1, 'rows deleted != 1')
}

export async function getChatByUUID(uuid: string) {
  const selected = await db.select().from(chats).where(eq(chats.uuid, uuid))
  return assert(selected.at(0), 'no chat found')
}

export async function getChatByClientID(clientID: number) {
  const selected = await db
    .select()
    .from(chats)
    .where(eq(chats.clientID, clientID))
  return assert(selected.at(0), 'no chat found')
}

export async function getChatMessagesByUUID(
  uuid: string
): Promise<MessageRecord[]> {
  const chatMessages = await db
    .select({messages})
    .from(messages)
    .innerJoin(chats, eq(messages.chatID, chats.id))
    .where(eq(chats.uuid, uuid))

  return chatMessages.map((m) => m.messages)
}
