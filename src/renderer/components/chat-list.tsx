import {useQuery} from '@tanstack/react-query'
import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useMemo, useState} from 'react'
import {Chat, Message} from '../../main/db/schema'

interface Props {
  activeChatId: number | null
  onSelectChat: (chat: Chat) => void
}

const ChatList: FC<Props> = ({activeChatId, onSelectChat}) => {
  const query = useQuery({
    queryKey: ['chats'],
    queryFn: api.listChats,
    onSuccess: chats => {
      const lastChat = chats.at(-1)
      if (!activeChatId && lastChat) onSelectChat(lastChat)
    }
  })

  const onContextMenu = (chatId: number) => {
    api.showChatListContextMenu(chatId)
  }

  const chats = query.data

  const [isUnread, setIsUnread] = useState<{[key: number]: boolean}>({})
  const [isTyping, setIsTyping] = useState<{[key: number]: boolean}>({})
  const typingTimeouts = useMemo(() => new Map<number, NodeJS.Timeout>(), [])

  useEffect(() => {
    if (activeChatId) {
      setIsUnread(u => ({...u, [activeChatId]: false}))
    }
  }, [activeChatId])

  useEffect(() => {
    const onMessage = (event: IpcRendererEvent, {chatId}: Message) => {
      if (chatId === activeChatId) {
        setIsUnread(u => ({...u, [chatId]: false}))
      } else {
        setIsUnread(u => ({...u, [chatId]: true}))
      }
    }

    api.onMessage(onMessage)

    return () => api.offMessage(onMessage)
  }, [activeChatId])

  useEffect(() => {
    const onMessageChunk = (event: IpcRendererEvent, chatId: number) => {
      setIsTyping(t => ({...t, [chatId]: true}))
      const timeout = typingTimeouts.get(chatId)

      if (timeout) {
        clearTimeout(timeout)
      }

      typingTimeouts.set(
        chatId,
        setTimeout(() => {
          setIsTyping(t => ({...t, [chatId]: false}))
          typingTimeouts.delete(chatId)
        }, 250)
      )
    }

    api.onMessageChunk(onMessageChunk)

    return () => api.offMessageChunk(onMessageChunk)
  }, [typingTimeouts])

  return (
    <div className="flex flex-col-reverse h-full overflow-scroll">
      {chats ? (
        <>
          {chats.length > 0 ? (
            chats.map(chat => (
              <button
                onContextMenu={() => onContextMenu(chat.id)}
                onClick={() => onSelectChat(chat)}
                className="px-2 py-1 text-left"
                key={chat.id}
              >
                <div
                  className={`p-2 flex align-middle justify-between rounded  ${
                    chat.id === activeChatId ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  <div>
                    {isUnread[chat.id] ? (
                      <span className="bg-blue-500 rounded-full h-2 w-2 inline-block mr-2" />
                    ) : null}
                    <span>{chat.name ?? 'Untitled chat'}</span>
                  </div>

                  <div>{isTyping[chat.id] ? <TypingIndicator /> : null}</div>
                </div>
              </button>
            ))
          ) : (
            <div>
              <p className="p-3">No chats</p>
            </div>
          )}
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
