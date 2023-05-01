import {Chat, Message} from '@withbotshq/shared/schema'
import {ScrollContainer} from '@withbotshq/ui/components/scroll-container'
import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useMemo, useState} from 'react'
import {ChatListItem} from './chat-list-item'

interface Props {
  chats: Chat[]
  activeChatId: number | null
  onSelectChat: (chatId: number) => void
}

const ChatList: FC<Props> = ({chats, activeChatId, onSelectChat}) => {
  const onContextMenu = (chatId: number) => {
    api.showChatListContextMenu(chatId)
  }

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

    return api.onMessage(onMessage)
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

    return api.onMessageChunk(onMessageChunk)
  }, [typingTimeouts])

  useEffect(() => {
    const onFocusNextChat = () => {
      if (!chats || chats.length === 0) {
        return
      }

      if (activeChatId == null) {
        const firstChat = chats.at(0)
        if (firstChat) onSelectChat(firstChat.id)
      }

      const index = chats.findIndex(chat => chat.id === activeChatId)
      const nextChat = chats.at(index + 1) ?? chats.at(0)
      if (nextChat) onSelectChat(nextChat.id)
    }

    const onFocusPrevChat = () => {
      if (!chats || chats.length === 0) {
        return
      }

      if (activeChatId == null) {
        const lastChat = chats.at(-1)
        if (lastChat) onSelectChat(lastChat.id)
      }

      const index = chats.findIndex(chat => chat.id === activeChatId)
      const previousChat = chats.at(index - 1) ?? chats.at(-1)
      if (previousChat) onSelectChat(previousChat.id)
    }

    const offNext = api.onFocusNextChat(onFocusNextChat)
    const offPrev = api.onFocusPrevChat(onFocusPrevChat)

    return () => {
      offNext()
      offPrev()
    }
  }, [activeChatId, chats, onSelectChat])

  return (
    <ScrollContainer>
      {chats ? (
        <>
          {chats.length > 0 ? (
            chats.map(chat => (
              <button
                onContextMenu={() => onContextMenu(chat.id)}
                onClick={() => onSelectChat(chat.id)}
                className="block w-full select-none px-2 py-1 text-left"
                key={chat.id}
              >
                <ChatListItem
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  isUnread={isUnread[chat.id] ?? false}
                  isReceivingResponse={isTyping[chat.id] ?? false}
                />
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
    </ScrollContainer>
  )
}

export {ChatList}
