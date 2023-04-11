import {assert} from '@jclem/assert'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useState} from 'react'
import type {Chat, Message} from '../../main/db/schema'
import {AppWindow} from './app-window'
import {ChatList} from './chat-list'
import {ChatSettings} from './chat-settings'
import {NewChatIcon} from './icons'
import {MessageComposer} from './message-composer'
import {MessageList} from './message-list'
import {TitleBar} from './title-bar'

export const Main: FC = () => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false)
  const queryClient = useQueryClient()

  const messagesQuery = useQuery({
    queryKey: ['messages', currentChat?.id],
    queryFn: () => api.listMessages(assert(currentChat?.id)),
    enabled: currentChat != null
  })

  const partialMessageQuery = useQuery({
    queryKey: ['partial-message', currentChat?.id],
    queryFn: () => api.getPartialMessage(assert(currentChat?.id)),
    enabled: currentChat != null
  })

  const messages = messagesQuery.data ?? []

  const createChat = useMutation({
    mutationFn: () => api.createChat(),
    onSuccess: chat => {
      queryClient.invalidateQueries(['chats'])
      setCurrentChat(chat)
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

    api.onMessage(onMessage)

    return () => api.offMessage(onMessage)
  }, [queryClient])

  useEffect(() => {
    const onMessageChunk = (event: IpcRendererEvent, chatId: number) => {
      queryClient.invalidateQueries(['partial-message', chatId])
    }

    api.onMessageChunk(onMessageChunk)

    return () => api.offMessageChunk(onMessageChunk)
  }, [queryClient])

  useEffect(() => {
    const onChatDeleted = (event: IpcRendererEvent, chatId: number) => {
      queryClient.invalidateQueries(['chats'])
      if (currentChat?.id === chatId) {
        setCurrentChat(null)
      }
    }

    api.onChatDeleted(onChatDeleted)

    return () => api.offChatDeleted(onChatDeleted)
  })

  return (
    <AppWindow>
      <AppWindow.Left>
        <div className="h-[44px] flex justify-between items-center pl-[15px] pr-2 app-region-drag">
          <div className="w-[52px] h-[12px]" />

          <div className="app-region-none">
            <button
              className="block rounded text-gray-400 hover:bg-gray-800"
              onClick={() => createChat.mutate()}
            >
              <NewChatIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatList
            activeChatId={currentChat?.id ?? null}
            onSelectChat={setCurrentChat}
          />
        </div>
      </AppWindow.Left>

      <AppWindow.Right>
        <div className="flex flex-col h-full">
          <div className="app-region-drag flex-none border-b">
            <TitleBar
              showInfoPanel={showInfoPanel}
              setShowInfoPanel={setShowInfoPanel}
            />
          </div>

          {/* FIXME: Ideally, the `overflow-hidden` isn't necessary here. This should be the concern of the `ScrollContainer` */}
          {currentChat ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <MessageList
                key={currentChat.id}
                messages={messages}
                partialMessageChunks={partialMessageQuery.data ?? null}
              />

              <div className="flex-none border-t p-3">
                <MessageComposer
                  onSubmit={content => sendMessage.mutate(content)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden gap-4 items-center p-8">
              <p>No chat selected.</p>
              <button
                onClick={() => createChat.mutate()}
                className="bg-blue-500 rounded px-2 py-1"
              >
                Click here to create one.
              </button>
            </div>
          )}

          {showInfoPanel && (
            <div className="w-1/3 border-l">
              <ChatSettings />
            </div>
          )}
        </div>
      </AppWindow.Right>
    </AppWindow>
  )
}
