import {OKResponse, UpdateChatRequest} from '@withbotshq/shared/api'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {deleteChat, updateChat} from '~/db'

const Params = z.object({
  params: z.object({
    chatClientID: z.preprocess(
      (value) => (typeof value === 'string' ? parseInt(value) : value),
      z.number()
    )
  })
})
type Params = z.infer<typeof Params>

export async function PATCH(request: NextRequest, params: unknown) {
  const {
    params: {chatClientID}
  } = Params.parse(params)

  const json = await request.json()
  const input = UpdateChatRequest.safeParse(json)

  if (!input.success) {
    return NextResponse.json({error: input.error}, {status: 422})
  }

  await updateChat(chatClientID, input.data.chat)
  return NextResponse.json({data: {ok: true}} satisfies OKResponse)
}

export async function DELETE(request: NextRequest, params: unknown) {
  const {
    params: {chatClientID}
  } = Params.parse(params)
  await deleteChat(chatClientID)
  return NextResponse.json({data: {ok: true}} satisfies OKResponse)
}
