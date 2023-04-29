import Link from 'next/link'
import {FC} from 'react'

const IndexPage: FC = () => {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="mt-16 text-center text-7xl font-black">Bots</h1>
      <ul className="flex justify-center gap-6 text-sky-600 underline underline-offset-2">
        <li>
          <Link href="/signup">Sign up</Link>
        </li>
        <li>
          <Link href="/login">Log in</Link>
        </li>
      </ul>
    </div>
  )
}

export default IndexPage
