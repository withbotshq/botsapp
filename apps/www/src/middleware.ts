import {getAuth, withClerkMiddleware} from '@clerk/nextjs/server'
import {NextRequest, NextResponse} from 'next/server'

const publicPaths = [
  '/',
  '/login*',
  '/signup*',
  '/api/chats',
  '/api/chats/\\w+',
  '/api/chats/\\w+/messages',
  '/api/chats/\\w+/messages/\\w+',
  '/shared-chats/\\w+$'
]

const isPublic = (path: string) =>
  Boolean(
    publicPaths.find((publicPath) =>
      path.match(new RegExp(`^${publicPath}$`.replace('*$', '($|/)')))
    )
  )

export default withClerkMiddleware((req: NextRequest) => {
  if (isPublic(req.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const {userId} = getAuth(req)

  if (!userId) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!static|.*\\..*|_next|favicon.ico).*)', '/']
}
