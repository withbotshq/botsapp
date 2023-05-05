import {NextRequest, NextResponse} from 'next/server'
import {z} from 'zod'
import {deleteChat} from '~/db'

const Params = z.object({params: z.object({uuid: z.string()})})
type Params = z.infer<typeof Params>

export async function DELETE(request: NextRequest, params: unknown) {
  const {
    params: {uuid}
  } = Params.parse(params)

  await deleteChat(uuid)

  return NextResponse.json({data: {ok: true}})
}
