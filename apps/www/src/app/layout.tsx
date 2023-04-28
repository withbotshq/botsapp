import {FC, PropsWithChildren} from 'react'
import '../styles/globals.css'

const RootLayout: FC<PropsWithChildren> = ({children}) => {
  return (
    <html>
      <head></head>
      <body>{children}</body>
    </html>
  )
}

export default RootLayout
