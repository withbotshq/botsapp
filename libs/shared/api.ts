import {z} from 'zod'
import {Chat, Message} from './schema'

export const CreateChatRequest = z.object({
  chat: Chat,
  messages: z.array(Message)
})
export type CreateChatRequest = z.infer<typeof CreateChatRequest>

export const UpdateChatRequest = z.object({
  chat: Chat
})
export type UpdateChatRequest = z.infer<typeof UpdateChatRequest>

export const CreateChatResponse = z.object({
  data: z.object({
    uuid: z.string()
  })
})
export type CreateChatResponse = z.infer<typeof CreateChatResponse>

export const CreateMessageRequest = Message
export type CreateMessageRequest = z.infer<typeof CreateMessageRequest>

export const OKResponse = z.object({
  data: z.object({
    ok: z.literal(true)
  })
})
export type OKResponse = z.infer<typeof OKResponse>
