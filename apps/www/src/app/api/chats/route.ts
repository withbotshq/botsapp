import {CreateChatRequest, CreateChatResponse} from '@withbotshq/shared/api'
import {NextRequest, NextResponse} from 'next/server'
import {createChat} from '~/db'

export async function POST(request: NextRequest) {
  const json = await request.json()
  const input = CreateChatRequest.safeParse(json)

  if (!input.success) {
    return NextResponse.json({error: input.error}, {status: 422})
  }

  const chatUUID = await createChat(input.data.chat, input.data.messages)

  return NextResponse.json({
    data: {uuid: chatUUID}
  } satisfies CreateChatResponse)
}
