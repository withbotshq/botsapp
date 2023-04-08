import {useQuery} from '@tanstack/react-query'
import {FC} from 'react'
import {Chat} from '../db/schema'

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

  return (
    <div className="flex flex-col">
      {chats ? (
        <>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <button
                onClick={() => onSelectChat(chat)}
                className={`border-b p-3 hover:bg-gray-900 text-left ${
                  chat.id === activeChatId ? 'bg-gray-900' : ''
                }`}
                key={chat.id}
              >
                {chat.name ?? 'Untitled chat'}
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
