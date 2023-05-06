import {Message} from '@withbotshq/shared/schema'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {createChat} from '~/db'

const CreateChat = z.object({
  name: z.string().nullable(),
  chatId: z.number(),
  messages: z.array(Message)
})
type CreateChat = z.infer<typeof CreateChat>

export async function POST(request: NextRequest) {
  const json = await request.json()
  const input = CreateChat.safeParse(json)

  if (!input.success) {
    return NextResponse.json({error: input.error}, {status: 422})
  }

  const chatUUID = await createChat(
    input.data.name,
    input.data.chatId,
    input.data.messages
  )

  return NextResponse.json({data: {uuid: chatUUID}})
}
