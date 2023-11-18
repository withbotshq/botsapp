import {assert} from '@jclem/assert'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import type {Chat, Message} from '../../../../shared/schema'
import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useState} from 'react'
import {useConfigModel} from '../hooks/use-config'
import {AppWindow} from './app-window'
import {ChatList} from './chat-list'
import {ChatSettings} from './chat-settings'
import {IconButton} from './icon-button'
import {NewChatIcon} from './icons'
import {MessageComposer} from './message-composer'
import {MessageList} from './message-list'
import {TitleBar} from './title-bar'

export const Main: FC = () => {
  const [currentChatId, setCurrentChatId] = useState<number | null>(null)
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false)
  const queryClient = useQueryClient()
  const {query: modelQuery} = useConfigModel()

  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: api.listChats,
    onSuccess: chats => {
      const firstChat = chats.at(0)
      if (!currentChatId && firstChat) setCurrentChatId(firstChat.id)
    }
  })

  const currentChat: Chat | null =
    chatsQuery.data?.find(chat => chat.id === currentChatId) ?? null

  const windowTitle = currentChat
    ? `${currentChat.name ?? 'Untitled chat'} (${
        currentChat.config?.model?.title ?? modelQuery.data?.title
      })`
    : 'Chat'

  const messagesQuery = useQuery({
    queryKey: ['messages', currentChat?.id],
    queryFn: () => api.listVisibleMessages(assert(currentChat?.id)),
    enabled: currentChat != null
  })

  const partialMessageQuery = useQuery({
    queryKey: ['partial-message', currentChat?.id],
    queryFn: () => api.getPartialMessage(assert(currentChat?.id)),
    enabled: currentChat != null
  })

  useEffect(() => {
    const onMessageDeleted = (event: IpcRendererEvent, chatId: number) => {
      queryClient.invalidateQueries(['messages', chatId])
      queryClient.invalidateQueries(['partial-message', chatId])
    }

    return api.onMessageDeleted(onMessageDeleted)
  }, [queryClient])

  const messages = messagesQuery.data ?? []

  const createChat = useMutation({
    mutationFn: () => api.createChat(),
    onSuccess: chat => {
      queryClient.invalidateQueries(['chats'])
      setCurrentChatId(chat.id)
    }
  })

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.createMessage(assert(currentChat).id, 'user', content),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', currentChat?.id])
    }
  })

  useEffect(() => {
    const onMessage = (event: IpcRendererEvent, message: Message) => {
      queryClient.invalidateQueries(['messages', message.chatId])
      queryClient.invalidateQueries(['partial-message', message.chatId])
    }

    return api.onMessage(onMessage)
  }, [queryClient])

  useEffect(() => {
    const onClearChat = () => {
      if (currentChatId) api.clearChat(currentChatId)
    }

    return api.onClearChat(onClearChat)
  }, [currentChatId])

  useEffect(() => {
    const onStopChat = () => {
      if (currentChatId) api.stopChat(currentChatId)
    }

    return api.onStopChat(onStopChat)
  }, [currentChatId])

  useEffect(() => {
    const onMessageChunk = (event: IpcRendererEvent, chatId: number) => {
      queryClient.invalidateQueries(['partial-message', chatId])
    }

    return api.onMessageChunk(onMessageChunk)
  }, [queryClient])

  useEffect(() => {
    const onChatCreated = (event: IpcRendererEvent, chat: Chat) => {
      queryClient.invalidateQueries(['chats'])
      setCurrentChatId(chat.id)
    }

    return api.onChatCreated(onChatCreated)
  }, [queryClient])

  useEffect(() => {
    const onChatDeleted = (event: IpcRendererEvent, chatId: number) => {
      queryClient.invalidateQueries(['chats'])
      if (currentChat?.id === chatId) {
        setCurrentChatId(null)
      }
    }

    return api.onChatDeleted(onChatDeleted)
  }, [currentChat?.id, queryClient])

  return (
    <AppWindow>
      <AppWindow.Left>
        <div className="flex h-full flex-col">
          <div className="app-region-drag flex h-[44px] flex-none items-center justify-between pl-[15px] pr-2">
            <div className="h-[12px] w-[52px]" />

            <div className="app-region-none">
              <IconButton
                icon={<NewChatIcon />}
                onClick={() => createChat.mutate()}
              />
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
        <div className="flex h-full">
          <div className="flex min-w-0 flex-1 flex-col">
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
                  chatId={currentChat.id}
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
                  className="rounded bg-blue-500 px-2 py-1 text-white"
                >
                  Click here to create one.
                </button>
              </div>
            )}
          </div>

          {showInfoPanel && (
            <div className="max-w-[240px] flex-1 border-l">
              <ChatSettings currentChat={currentChat} />
            </div>
          )}
        </div>
      </AppWindow.Right>
    </AppWindow>
  )
}
