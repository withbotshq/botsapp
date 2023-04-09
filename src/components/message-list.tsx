import {IpcRendererEvent} from 'electron'
import {FC, useEffect, useState} from 'react'
import {Message} from '../db/schema'
import {MessageRenderer} from './message'
import {ScrollContainer} from './scroll-container'

const isMe = (message: Message) => {
  return message.role === 'user'
}

export const MessageList: FC<{messages: Message[]}> = ({messages}) => {
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)

  useEffect(() => {
    const onChunk = (event: IpcRendererEvent, chunk: string) => {
      setStreamingMessage((message) =>
        message
          ? {
              ...message,
              content: message.content + chunk
            }
          : {
              id: Math.random(),
              chatId: Math.random(),
              role: 'assistant',
              content: chunk,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
      )
    }

    api.onMessageChunk(onChunk)

    return () => api.offMessageChunk(onChunk)
  }, [])

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

        {streamingMessage && <MessageRenderer message={streamingMessage} />}
      </div>
    </ScrollContainer>
  )
}
