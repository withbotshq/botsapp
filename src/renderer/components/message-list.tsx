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
      <div
        className="flex flex-col gap-2 p-3"
        style={{WebkitOverflowScrolling: 'touch'}}
      >
        {(partialMessage ? [...messages, partialMessage] : messages).map(
          message => (
            <div
              className={`flex gap-2 ${
                isMe(message) ? 'flex-row-reverse items-end' : 'items-start'
              }`}
              key={message.id}
            >
              <img
                className="h-7 w-7 rounded-full"
                src={'https://github.com/nat.png'}
              />

              <MessageRenderer message={message} />
            </div>
          )
        )}
      </div>
    </ScrollContainer>
  )
}
