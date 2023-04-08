import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {FC} from 'react'
import {Main} from './main'

const queryClient = new QueryClient()

export const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Main />
    </QueryClientProvider>
  )
}
