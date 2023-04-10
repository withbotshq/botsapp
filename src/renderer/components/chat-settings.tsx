import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {FC} from 'react'
// import {Plugin, initialPlugins} from '../models/plugin'

const ChatSettings: FC = () => {
  const queryClient = useQueryClient()

  const apiKeyQuery = useQuery({
    queryKey: ['config:openAIAPIKey'],
    queryFn: api.getOpenAIAPIKey
  })

  const setApiKey = useMutation({
    mutationFn: async (key: string) => api.setOpenAIAPIKey(key),
    onSuccess: () => queryClient.invalidateQueries(['config:openAIAPIKey'])
  })

  return (
    <div className="p-2">
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase text-gray-500">OpenAI</h3>

        <input
          className="w-full rounded border bg-transparent p-2 py-1 text-white"
          type="password"
          placeholder="API Key"
          value={apiKeyQuery.data ?? ''}
          onChange={e => setApiKey.mutate(e.target.value)}
        />
      </div>
    </div>
  )
}

export {ChatSettings}
