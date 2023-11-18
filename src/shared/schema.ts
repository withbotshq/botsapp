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
    z.literal('assistant'),
    z.literal('function')
  ]),
  name: z.string().optional(),
  content: z.string().nullable(),
  function_call: z
    .object({
      name: z.string(),
      arguments: z.string()
    })
    .optional()
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

export const VisibleMessage = Message.extend({
  role: z.union([
    z.literal('user'),
    z.literal('system'),
    z.literal('assistant')
  ])
})
export type VisibleMessage = z.infer<typeof VisibleMessage>
