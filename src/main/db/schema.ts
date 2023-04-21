import {z} from 'zod'

export const Chat = z.object({
  id: z.number(),
  name: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Chat = z.infer<typeof Chat>

export const Message = z.object({
  id: z.number(),
  role: z.union([
    z.literal('user'),
    z.literal('system'),
    z.literal('assistant')
  ]),
  content: z.string(),
  chatId: z.number(),
  clientOnly: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Message = z.infer<typeof Message>
