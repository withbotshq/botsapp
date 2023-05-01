import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {Chat} from '@withbotshq/shared/schema'
import {formatDistanceToNowStrict} from 'date-fns'
import {IpcRendererEvent} from 'electron'
import {KeyboardEventHandler, useEffect, useState} from 'react'

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

function TypingIndicator() {
  return (
    <>
      <span className="animate-[ping_1s_100ms_ease-in-out_infinite]">·</span>
      <span className="animate-[ping_1s_200ms_ease-in-out_infinite]">·</span>
      <span className="animate-[ping_1s_300ms_ease-in-out_infinite]">·</span>
    </>
  )
}

export {ChatListItem}
