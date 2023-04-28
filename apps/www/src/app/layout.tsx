import {ClerkProvider} from '@clerk/nextjs/app-beta'
import {FC, PropsWithChildren} from 'react'
import '../styles/globals.css'

const RootLayout: FC<PropsWithChildren> = ({children}) => {
  return (
    <html lang="en">
      <head></head>
      <ClerkProvider>
        <body>{children}</body>
      </ClerkProvider>
    </html>
  )
}

export default RootLayout
