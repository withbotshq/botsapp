import {assert} from '@jclem/assert'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useState} from 'react'
import type {Chat, Message} from '../../main/db/schema'
import {useConfigModel} from '../hooks/use-config'
import {AppWindow} from './app-window'
import {ChatList} from './chat-list'
import {ChatSettings} from './chat-settings'
import {NewChatIcon} from './icons'
import {MessageComposer} from './message-composer'
import {MessageList} from './message-list'
import {TitleBar} from './title-bar'

export const Main: FC = () => {
  const [currentChatId, setCurrentChatId] = useState<number | null>(null)
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false)
  const queryClient = useQueryClient()
  const {query: modelQuery} = useConfigModel()

  const chatsQuery = useQuery(['chats'], () => api.invoke('chat:list'), {
    onSuccess: chats => {
      const firstChat = chats.at(0)
      if (!currentChatId && firstChat) setCurrentChatId(firstChat.id)
    }
  })

  const currentChat =
    chatsQuery.data?.find(chat => chat.id === currentChatId) ?? null

  const windowTitle = currentChat
    ? `${currentChat.name ?? 'Untitled chat'} (${modelQuery.data?.title})`
    : 'Chat'

  const messagesQuery = useQuery(
    ['messaging', 'list', currentChat?.id],
    () => api.invoke('messaging:list', assert(currentChat?.id)),
    {
      enabled: currentChat != null
    }
  )

  const partialMessageQuery = useQuery(
    ['messaging', 'partial', currentChat?.id],
    () => api.invoke('messaging:read:partial', assert(currentChat?.id)),
    {
      enabled: currentChat != null
    }
  )

  const messages = messagesQuery.data ?? []

  const createChat = useMutation(() => api.invoke('chat:create'), {
    onSuccess: chat => {
      queryClient.invalidateQueries(['chats'])
      setCurrentChatId(chat.id)
    }
  })

  const sendMessage = useMutation(
    (content: string) =>
      api.invoke('messaging:send', assert(currentChat).id, 'user', content),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messaging', 'list', currentChat?.id])
      }
    }
  )

  useEffect(() => {
    const onMessage = (event: IpcRendererEvent, message: Message) => {
      queryClient.invalidateQueries(['messaging', 'list', message.chatId])
      queryClient.invalidateQueries(['messaging', 'partial', message.chatId])
    }

    return api.on('messaging:message', onMessage)
  }, [queryClient])

  useEffect(() => {
    const onStopChat = () => {
      if (currentChatId) api.send('chat:stop', currentChatId)
    }

    return api.on('chat:stop', onStopChat)
  }, [currentChatId])

  useEffect(() => {
    const onMessageChunk = (event: IpcRendererEvent, chatId: number) => {
      queryClient.invalidateQueries(['messaging', 'partial', chatId])
    }

    return api.on('messaging:chunk', onMessageChunk)
  }, [queryClient])

  useEffect(() => {
    const onChatCreated = (event: IpcRendererEvent, chat: Chat) => {
      queryClient.invalidateQueries(['chats'])
      setCurrentChatId(chat.id)
    }

    return api.on('chat:create', onChatCreated)
  }, [queryClient])

  useEffect(() => {
    const onChatDeleted = (event: IpcRendererEvent, chatId: number) => {
      queryClient.invalidateQueries(['chats'])
      if (currentChat?.id === chatId) {
        setCurrentChatId(null)
      }
    }

    return api.on('chat:delete', onChatDeleted)
  }, [currentChat?.id, queryClient])

  return (
    <AppWindow>
      <AppWindow.Left>
        <div className="flex h-full flex-col">
          <div className="app-region-drag flex h-[44px] flex-none items-center justify-between pl-[15px] pr-2">
            <div className="h-[12px] w-[52px]" />

            <div className="app-region-none">
              <button
                className="block rounded text-gray-400 hover:bg-white/10"
                onClick={() => createChat.mutate()}
              >
                <NewChatIcon />
              </button>
            </div>
          </div>

          <div className="min-h-0 min-w-0 flex-1">
            <ChatList
              chats={chatsQuery.data ?? []}
              activeChatId={currentChat?.id ?? null}
              onSelectChat={setCurrentChatId}
            />
          </div>
        </div>
      </AppWindow.Left>

      <AppWindow.Right>
        <div className="flex h-full flex-col">
          <div className="app-region-drag flex-none border-b">
            <TitleBar
              title={windowTitle}
              showInfoPanel={showInfoPanel}
              setShowInfoPanel={setShowInfoPanel}
            />
          </div>

          {currentChat ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <MessageList
                key={currentChat.id}
                messages={messages}
                partialMessageChunks={partialMessageQuery.data ?? null}
              />

              <div className="flex-none border-t p-3">
                <MessageComposer
                  key={currentChat?.id}
                  onSubmit={content => sendMessage.mutate(content)}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center gap-4 p-8">
              <p>No chat selected.</p>

              <button
                onClick={() => createChat.mutate()}
                className="rounded bg-blue-500 px-2 py-1"
              >
                Click here to create one.
              </button>
            </div>
          )}

          {showInfoPanel && (
            <div className="border-t">
              <ChatSettings />
            </div>
          )}
        </div>
      </AppWindow.Right>
    </AppWindow>
  )
}
