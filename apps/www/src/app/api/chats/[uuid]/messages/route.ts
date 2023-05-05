import {MessageBase} from '@withbotshq/shared/schema'
import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {createMessage} from '~/db'

const CreateMessageRequest = MessageBase
const Params = z.object({params: z.object({uuid: z.string()})})
type Params = z.infer<typeof Params>

export async function POST(request: NextRequest, params: unknown) {
  const json = await request.json()
  const input = CreateMessageRequest.safeParse(json)

  if (!input.success) {
    return NextResponse.json({error: input.error}, {status: 422})
  }

  const {
    params: {uuid}
  } = Params.parse(params)

  await createMessage(uuid, input.data)
  return NextResponse.json({data: {ok: true}})
}
