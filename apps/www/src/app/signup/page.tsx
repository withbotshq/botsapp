import {SignUp} from '@clerk/nextjs/app-beta'
import {FC} from 'react'

const SignupPage: FC = () => {
  return <SignUp signInUrl="/login" />
}

export default SignupPage
