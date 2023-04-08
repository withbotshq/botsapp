import {FC} from 'react'
import {Message} from '../db/schema'
import {MessageRenderer} from './message'
import {ScrollContainer} from './scroll-container'

const isMe = (message: Message) => {
  return message.role === 'user'
}

export const MessageList: FC<{messages: Message[]}> = ({messages}) => {
  return (
    <ScrollContainer>
      <div
        className="flex flex-col gap-2 p-3"
        style={{WebkitOverflowScrolling: 'touch'}}
      >
        {messages.map((message) => (
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
        ))}
      </div>
    </ScrollContainer>
  )
}
