import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {FC} from 'react'
import {useConfigModel} from '../hooks/use-config'

const ChatSettings: FC = () => {
  const queryClient = useQueryClient()
  const {query: modelQuery, mutation: modelMutation} = useConfigModel()

  const apiKeyQuery = useQuery(['config', 'openai-api-key'], () =>
    api.invoke('config:read:openai-api-key')
  )

  const setApiKey = useMutation(
    async (key: string) => api.send('config:write:openai-api-key', key),
    {
      onSuccess: () =>
        queryClient.invalidateQueries(['config', 'openai-api-key'])
    }
  )

  return (
    <div className="flex w-full flex-row gap-4 p-2">
      <div className="w-full">
        <h3 className="text-xs font-bold uppercase text-gray-500">OpenAI</h3>

        <input
          className="w-full rounded border bg-transparent p-2 py-1 dark:text-white"
          type="password"
          placeholder="API Key"
          value={apiKeyQuery.data ?? ''}
          onChange={e => setApiKey.mutate(e.target.value)}
        />
      </div>

      <div className="w-full">
        <h3 className="text-xs font-bold uppercase text-gray-500">Model</h3>

        <select
          className="w-full rounded border bg-transparent p-2 py-1 dark:text-white"
          value={modelQuery.data?.key ?? 'gpt-3.5-turbo'}
          onChange={e => modelMutation.mutate(e.target.value)}
        >
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </div>
    </div>
  )
}

export {ChatSettings}
