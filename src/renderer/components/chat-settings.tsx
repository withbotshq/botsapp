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

  const modelQuery = useQuery({
    queryKey: ['config:model'],
    queryFn: api.getModel
  })

  const setModel = useMutation({
    mutationFn: async (model: string) => api.setModel(model),
    onSuccess: () => queryClient.invalidateQueries(['config:model'])
  })

  return (
    <div className="flex flex-row gap-4 p-2 w-full">
      <div className="w-full">
        <h3 className="text-xs font-bold uppercase text-gray-500">OpenAI</h3>

        <input
          className="w-full rounded border bg-transparent p-2 py-1 text-white"
          type="password"
          placeholder="API Key"
          value={apiKeyQuery.data ?? ''}
          onChange={e => setApiKey.mutate(e.target.value)}
        />
      </div>

      <div className="w-full">
        <h3 className="text-xs font-bold uppercase text-gray-500">Model</h3>

        <select
          className="w-full rounded border bg-transparent p-2 py-1 text-white"
          value={modelQuery.data?.key ?? 'gpt-3.5-turbo'}
          onChange={e => setModel.mutate(e.target.value)}
        >
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </div>
    </div>
  )
}

export {ChatSettings}
