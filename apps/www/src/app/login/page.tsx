import {SignIn} from '@clerk/nextjs/app-beta'
import {FC} from 'react'

const LoginPage: FC = () => {
  return <SignIn signUpUrl="/signup" />
}

export default LoginPage
