import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {formatDistanceToNowStrict} from 'date-fns'
import {IpcRendererEvent} from 'electron'
import {FC, KeyboardEventHandler, useEffect, useMemo, useState} from 'react'
import {Chat, Message} from '../../main/db/schema'
import {ScrollContainer} from './scroll-container'

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
                className="block w-full select-none px-2 py-1"
                key={chat.id}
              >
                <ChatListItem
                  chat={chat}
                  isActive={chat.id === activeChatId}
                  isUnread={isUnread[chat.id]}
                  isReceivingResponse={isTyping[chat.id]}
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

function TypingIndicator() {
  return (
    <>
      <span className="animate-[ping_1s_100ms_ease-in-out_infinite]">·</span>
      <span className="animate-[ping_1s_200ms_ease-in-out_infinite]">·</span>
      <span className="animate-[ping_1s_300ms_ease-in-out_infinite]">·</span>
    </>
  )
}

function ChatName({chat}: {chat: Chat}) {
  const [isEditingName, setIsEditingName] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const onChatRename = (event: IpcRendererEvent, chatId: number) => {
      if (chatId === chat.id) {
        setIsEditingName(true)
      }
    }

    return api.onChatRename(onChatRename)
  }, [chat.id])

  const renameChatMutation = useMutation({
    mutationFn: async (name: string | null) => {
      await api.renameChat(chat.id, name)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chats'])
    }
  })

  const onBlur = () => {
    setIsEditingName(false)
  }

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = e => {
    switch (e.key) {
      case 'Escape':
        setIsEditingName(false)
        break
      case 'Enter': {
        const name = e.currentTarget.value.trim()
        renameChatMutation.mutate(name || null)
        setIsEditingName(false)
      }
    }
  }

  useEffect(() => {
    const onChatRename = (event: IpcRendererEvent, chatId: number | null) => {
      if (chatId === chat.id) {
        setIsEditingName(true)
      }
    }

    return api.onChatRename(onChatRename)
  }, [chat.id])

  return isEditingName ? (
    <input
      type="text"
      className="bg-transparent font-bold text-inherit"
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      defaultValue={chat.name ?? ''}
      autoFocus
    />
  ) : (
    <span onDoubleClick={() => setIsEditingName(true)} className="font-bold">
      {chat.name ?? 'Untitled chat'}
    </span>
  )
}

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  isUnread: boolean
  isReceivingResponse: boolean
}

function ChatListItem({
  chat,
  isActive,
  isUnread,
  isReceivingResponse
}: ChatListItemProps) {
  const getLastMessagesQuery = useQuery({
    queryKey: ['messages', chat.id],
    queryFn: async () => {
      const lastMessages = await api.listMessages(chat.id)
      return lastMessages
    }
  })

  const partialMessageQuery = useQuery({
    queryKey: ['partial-message', chat.id],
    queryFn: () => api.getPartialMessage(chat.id)
  })

  const lastMessage = partialMessageQuery.data?.join('') ??
    getLastMessagesQuery.data?.at(-1)?.content ?? <>&nbsp;</>

  return (
    <div
      className={`flex justify-between rounded p-2 align-middle ${
        isActive ? 'bg-blue-500 text-white' : ''
      }`}
    >
      <div className="w-full min-w-0">
        <div className="flex items-baseline justify-between">
          <div>
            {isUnread ? (
              <span
                className={`mr-2 inline-block h-2 w-2 rounded-full ${
                  isActive ? 'bg-white' : 'bg-blue-500'
                }`}
              />
            ) : null}

            <ChatName chat={chat} />
          </div>

          <div
            className={`text-sm ${
              isActive ? 'text-blue-200' : 'text-gray-400'
            }`}
          >
            {formatDistanceToNowStrict(new Date(chat.createdAt))}
          </div>
        </div>

        <div
          className={`truncate ${isActive ? 'text-blue-200' : 'text-gray-400'}`}
        >
          {lastMessage}
        </div>
      </div>

      <div>{isReceivingResponse ? <TypingIndicator /> : null}</div>
    </div>
  )
}
