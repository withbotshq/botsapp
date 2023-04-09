import {useQuery} from '@tanstack/react-query'
import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useMemo, useState} from 'react'
import {Chat, Message} from '../db/schema'

interface Props {
  activeChatId: number | null
  onCreateChat: () => void
  onSelectChat: (chat: Chat) => void
}

const ChatList: FC<Props> = ({activeChatId, onCreateChat, onSelectChat}) => {
  const query = useQuery({
    queryKey: ['chats'],
    queryFn: api.listChats,
    onSuccess: (chats) => {
      if (!activeChatId && chats.length > 0) {
        onSelectChat(chats[0])
      }
    }
  })

  const chats = query.data

  const [isUnread, setIsUnread] = useState<{[key: number]: boolean}>({})
  const [isTyping, setIsTyping] = useState<{[key: number]: boolean}>({})
  const typingTimeouts = useMemo(() => new Map<number, NodeJS.Timeout>(), [])

  useEffect(() => {
    if (activeChatId) {
      setIsUnread((u) => ({...u, [activeChatId]: false}))
    }
  }, [activeChatId])

  useEffect(() => {
    const onMessage = (event: IpcRendererEvent, {chatId}: Message) => {
      if (chatId === activeChatId) {
        setIsUnread((u) => ({...u, [chatId]: false}))
      } else {
        setIsUnread((u) => ({...u, [chatId]: true}))
      }
    }

    api.onMessage(onMessage)

    return () => api.offMessage(onMessage)
  }, [activeChatId])

  useEffect(() => {
    const onMessageChunk = (event: IpcRendererEvent, chatId: number) => {
      setIsTyping((t) => ({...t, [chatId]: true}))
      const timeout = typingTimeouts.get(chatId)

      if (timeout) {
        clearTimeout(timeout)
      }

      typingTimeouts.set(
        chatId,
        setTimeout(() => {
          setIsTyping((t) => ({...t, [chatId]: false}))
          typingTimeouts.delete(chatId)
        }, 250)
      )
    }

    api.onMessageChunk(onMessageChunk)

    return () => api.offMessageChunk(onMessageChunk)
  }, [])

  return (
    <div className="flex flex-col">
      {chats ? (
        <>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <button
                onClick={() => onSelectChat(chat)}
                className={`flex align-middle justify-between border-b p-3 hover:bg-gray-900 text-left ${
                  chat.id === activeChatId ? 'bg-gray-900' : ''
                }`}
                key={chat.id}
              >
                <div>
                  {isUnread[chat.id] ? (
                    <span className="bg-blue-500 rounded-full h-2 w-2 inline-block mr-2" />
                  ) : null}
                  <span>{chat.name ?? 'Untitled chat'}</span>
                </div>
                <div>{isTyping[chat.id] ? <TypingIndicator /> : null}</div>
              </button>
            ))
          ) : (
            <div>
              <p className="p-3">No chats</p>
            </div>
          )}
          <button
            onClick={onCreateChat}
            className="bg-blue-500 rounded px-2 py-1 mx-4 my-2"
          >
            Create Chat
          </button>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

export {ChatList}

function TypingIndicator() {
  return (
    <>
      <span className="animate-[ping_1s_100ms_ease-in-out_infinite]">·</span>
      <span className="animate-[ping_1s_200ms_ease-in-out_infinite]">·</span>
      <span className="animate-[ping_1s_300ms_ease-in-out_infinite]">·</span>
    </>
  )
}
