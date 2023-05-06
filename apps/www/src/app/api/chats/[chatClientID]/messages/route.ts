import {OKResponse} from '@withbotshq/shared/api'
import {Message} from '@withbotshq/shared/schema'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {createMessage} from '~/db'

const CreateMessageRequest = Message
const Params = z.object({
  params: z.object({
    chatClientID: z.preprocess(
      (value) => (typeof value === 'string' ? parseInt(value) : value),
      z.number()
    )
  })
})
type Params = z.infer<typeof Params>

export async function POST(request: NextRequest, params: unknown) {
  const json = await request.json()
  const input = CreateMessageRequest.safeParse(json)

  if (!input.success) {
    return NextResponse.json({error: input.error}, {status: 422})
  }

  const {
    params: {chatClientID}
  } = Params.parse(params)

  await createMessage(chatClientID, input.data)
  return NextResponse.json({data: {ok: true}} satisfies OKResponse)
}
