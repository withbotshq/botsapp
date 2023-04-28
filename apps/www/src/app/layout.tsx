import {ClerkProvider, UserButton} from '@clerk/nextjs/app-beta'
import {FC, PropsWithChildren} from 'react'
import '../styles/globals.css'

const RootLayout: FC<PropsWithChildren> = ({children}) => {
  return (
    <html lang="en">
      <head></head>
      <ClerkProvider>
        <body>
          <div className="flex flex-col gap-2">
            <header className="flex h-12 flex-row items-center justify-end px-2 py-2">
              <UserButton />
            </header>

            <main>{children}</main>
          </div>
        </body>
      </ClerkProvider>
    </html>
  )
}

export default RootLayout
