import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Chat} from '@withbotshq/shared/schema'
import {FC, PropsWithChildren} from 'react'
import {useConfigModel} from '../hooks/use-config'
// import {Plugin, initialPlugins} from '../models/plugin'

interface Props {
  currentChat: Chat | null
}

const ChatSettings: FC<Props> = ({currentChat}) => {
  const queryClient = useQueryClient()
  const {query: modelQuery, mutation: modelMutation} = useConfigModel()

  const apiKeyQuery = useQuery({
    queryKey: ['config:openAIAPIKey'],
    queryFn: api.getOpenAIAPIKey
  })

  const setApiKey = useMutation({
    mutationFn: async (key: string) => api.setOpenAIAPIKey(key),
    onSuccess: () => queryClient.invalidateQueries(['config:openAIAPIKey'])
  })

  const toggleChatShare = useMutation({
    mutationFn: async (chatId: number) => api.toggleChatShare(chatId),
    onSuccess: () => queryClient.invalidateQueries(['chats'])
  })

  const toggleCurrentChatShare = () => {
    if (!currentChat) return
    toggleChatShare.mutate(currentChat.id)
  }

  return (
    <div className="flex w-full flex-col gap-4 p-2">
      <SettingsSection title="OpenAI API Token">
        <input
          className="w-full rounded border bg-transparent p-2 py-1 dark:text-white"
          type="password"
          placeholder="API Key"
          value={apiKeyQuery.data ?? ''}
          onChange={e => setApiKey.mutate(e.target.value)}
        />
      </SettingsSection>

      <SettingsSection title="Model">
        <select
          className="w-full rounded border bg-transparent p-2 py-1 dark:text-white"
          value={modelQuery.data?.key ?? 'gpt-3.5-turbo'}
          onChange={e => modelMutation.mutate(e.target.value)}
        >
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </SettingsSection>

      {currentChat && (
        <SettingsSection title="Share">
          <div className="flex gap-2">
            <input
              type="checkbox"
              checked={!!currentChat?.shareUUID}
              onChange={toggleCurrentChatShare}
              disabled={toggleChatShare.isLoading}
            />
            {currentChat.shareUUID != null && (
              <a href={api.getChatShareURL(currentChat.shareUUID)}>
                {api.getChatShareURL(currentChat.shareUUID)}
              </a>
            )}
          </div>
        </SettingsSection>
      )}
    </div>
  )
}

export {ChatSettings}

const SettingsSection: FC<PropsWithChildren<{title: string}>> = ({
  children,
  title
}) => (
  <div className="w-full">
    <h3 className="text-xs font-bold uppercase text-gray-500">{title}</h3>
    {children}
  </div>
)
