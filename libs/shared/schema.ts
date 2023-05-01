import {z} from 'zod'
import {BotsFile} from './botsfile'

export const Chat = z.object({
  id: z.number(),
  name: z.string().nullable(),
  config: BotsFile.optional().nullable(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Chat = z.infer<typeof Chat>

export const MessageBase = z.object({
  role: z.union([
    z.literal('user'),
    z.literal('system'),
    z.literal('assistant')
  ]),
  content: z.string()
})
export type MessageBase = z.infer<typeof MessageBase>

export const Message = MessageBase.extend({
  id: z.number(),
  chatId: z.number(),
  clientOnly: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
})
export type Message = z.infer<typeof Message>
