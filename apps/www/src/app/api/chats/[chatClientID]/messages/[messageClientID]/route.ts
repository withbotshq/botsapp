import {CreateMessageRequest, OKResponse} from '@withbotshq/shared/api'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {deleteMessage} from '~/db'

const Params = z.object({
  params: z.object({
    chatClientID: z.preprocess(
      (value) => (typeof value === 'string' ? parseInt(value) : value),
      z.number()
    ),
    messageClientID: z.preprocess(
      (value) => (typeof value === 'string' ? parseInt(value) : value),
      z.number()
    )
  })
})
type Params = z.infer<typeof Params>

export async function DELETE(request: NextRequest, params: unknown) {
  const json = await request.json()
  const input = CreateMessageRequest.safeParse(json)

  if (!input.success) {
    return NextResponse.json({error: input.error}, {status: 422})
  }

  const {
    params: {chatClientID, messageClientID}
  } = Params.parse(params)

  await deleteMessage(chatClientID, messageClientID)

  return NextResponse.json({data: {ok: true}} satisfies OKResponse)
}
