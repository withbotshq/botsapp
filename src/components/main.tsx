import {assert} from '@jclem/assert'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useState} from 'react'
import type {Chat, Message} from '../db/schema'
import {ChatList} from './chat-list'
import {ChatSettings} from './chat-settings'
import {MessageComposer} from './message-composer'
import {MessageList} from './message-list'
import {TitleBar} from './title-bar'

export const Main: FC = () => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false)
  const [showChatList, setShowChatList] = useState<boolean>(true)
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

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0">
      <div className="flex h-full">
        {showChatList && (
          <div className="w-1/3 border-r">
            {/* FIXME: Remove the hard-coded margin here */}
            <div className="mt-16">
              <ChatList
                activeChatId={currentChat?.id ?? null}
                onCreateChat={() => createChat.mutate()}
                onSelectChat={setCurrentChat}
              />
            </div>
          </div>
        )}

        <div className="flex h-full w-full flex-1 flex-col">
          <div className="app-region-drag flex-none border-b">
            <TitleBar
              showChatList={showChatList}
              setShowChatList={setShowChatList}
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
        </div>

        {showInfoPanel && (
          <div className="w-1/3 border-l">
            <ChatSettings />
          </div>
        )}
      </div>
    </div>
  )
}
