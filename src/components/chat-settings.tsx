import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {FC, useState} from 'react'
import {Plugin, initialPlugins} from '../models/plugin'

const ChatSettings: FC = () => {
  const [plugins] = useState<Plugin[]>(initialPlugins)
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
          onChange={(e) => setApiKey.mutate(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase text-gray-500">Sharing</h3>

        <input
          className="w-full rounded border bg-transparent p-2 py-1 text-white"
          type="text"
          value="https://nat.dev/ac9d90b1a6ab58bd153519767affcb4c"
        />
      </div>

      <h3 className="text-xs font-bold uppercase text-gray-500">Plugins</h3>

      <div className="flex flex-col">
        {plugins.map((plugin) => (
          <div key={plugin.name} className="border-b py-2">
            <div className="flex gap-2">
              {plugin.avatarUrl ? (
                <img className="h-6 w-6 rounded" src={plugin.avatarUrl} />
              ) : (
                <div className="grid h-6 w-6 place-items-center rounded bg-gray-800 text-gray-600">
                  LS
                </div>
              )}
              <input
                checked={plugin.enabled}
                className="mr-1"
                type="checkbox"
              />{' '}
              {plugin.name}
            </div>

            {plugin.meta?.path && (
              <div className="font-mono text-xs text-gray-500">
                {plugin.meta.path}
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 className="text-xs font-bold uppercase text-gray-500">Export</h3>

      <div>REST API</div>

      <div>WhatsApp Bot</div>

      <div>Telegram Bot</div>

      <div>Slack Bot</div>
    </div>
  )
}

export {ChatSettings}
