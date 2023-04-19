import {z} from 'zod'

export const Chat = z.object({
  id: z.number(),
  name: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number()
})
export type Chat = z.infer<typeof Chat>

export const BaseMessage = z.object({
  role: z.string(),
  content: z.string()
})
export type BaseMessage = z.infer<typeof BaseMessage>

export const Message = BaseMessage.extend({
  id: z.number(),
  chatId: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  invisible: z.boolean().optional()
})
export type Message = z.infer<typeof Message>
