import {useQuery} from '@tanstack/react-query'
import {formatDistanceToNowStrict} from 'date-fns'
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

  useEffect(() => {
    const onFocusNextChat = () => {
      if (!chats || chats.length === 0) {
        return
      }

      if (activeChatId == null) {
        const firstChat = chats.at(0)
        if (firstChat) onSelectChat(firstChat)
      }

      const index = chats.findIndex(chat => chat.id === activeChatId)
      const nextChat = chats.at(index + 1) ?? chats.at(0)
      if (nextChat) onSelectChat(nextChat)
    }

    const onFocusPrevChat = () => {
      if (!chats || chats.length === 0) {
        return
      }

      if (activeChatId == null) {
        const lastChat = chats.at(-1)
        if (lastChat) onSelectChat(lastChat)
      }

      const index = chats.findIndex(chat => chat.id === activeChatId)
      const previousChat = chats.at(index - 1) ?? chats.at(-1)
      if (previousChat) onSelectChat(previousChat)
    }

    api.onFocusNextChat(onFocusNextChat)
    api.onFocusPrevChat(onFocusPrevChat)

    return () => {
      api.offFocusNextChat(onFocusNextChat)
      api.offFocusPrevChat(onFocusPrevChat)
    }
  }, [activeChatId, chats, onSelectChat])

  return (
    <div className="flex h-full flex-col overflow-scroll">
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
                  className={`flex justify-between rounded p-2 align-middle  ${
                    chat.id === activeChatId ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between">
                      <div>
                        {isUnread[chat.id] ? (
                          <span
                            className={`mr-2 inline-block h-2 w-2 rounded-full ${
                              chat.id === activeChatId
                                ? 'bg-white'
                                : 'bg-blue-500'
                            }`}
                          />
                        ) : null}
                        <span className="font-bold">
                          {chat.name ?? 'Untitled chat'}
                        </span>
                      </div>

                      <div
                        className={`text-sm ${
                          chat.id === activeChatId
                            ? 'text-blue-200'
                            : 'text-gray-400'
                        }`}
                      >
                        {formatDistanceToNowStrict(new Date(chat.createdAt))}
                      </div>
                    </div>

                    <div
                      className={`truncate ${
                        chat.id === activeChatId
                          ? 'text-blue-200'
                          : 'text-gray-400'
                      }`}
                    >
                      This is the beginning of the last line of the chat
                    </div>
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
