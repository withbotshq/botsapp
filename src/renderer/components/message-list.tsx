import {FC} from 'react'
import {Message} from '../../main/db/schema'
import {MessageRenderer} from './message'
import {ScrollContainer} from './scroll-container'

const isMe = (message: Message) => {
  return message.role === 'user'
}

interface Props {
  messages: Message[]
  partialMessageChunks: string[] | null
}

export const MessageList: FC<Props> = ({messages, partialMessageChunks}) => {
  const partialMessage = partialMessageChunks
    ? {
        id: Math.random(),
        chatId: Math.random(),
        role: 'assistant',
        content: partialMessageChunks.join(''),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    : null

  return (
    <ScrollContainer>
      {(partialMessage ? [...messages, partialMessage] : messages).map(
        message => (
          <div
            className={`flex gap-4 border-b p-4 ${
              isMe(message) ? '' : 'bg-gray-900'
            }`}
            key={message.id}
          >
            {isMe(message) ? (
              <div className="h-6 w-6 flex-none rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500" />
            ) : (
              <img
                className="block h-6 w-6 flex-none rounded-full"
                src={'https://github.com/openai.png'}
              />
            )}

            <div className="mt-0.5 min-w-0">
              <MessageRenderer message={message} />
            </div>
          </div>
        )
      )}
    </ScrollContainer>
  )
}
