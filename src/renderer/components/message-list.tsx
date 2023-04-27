import {cva} from 'class-variance-authority'
import {FC} from 'react'
import {Message} from '../../main/db/schema'
import {useConfigModel} from '../hooks/use-config'
import OpenAIIcon from './icons/open-ai-icon'
import {MessageRenderer} from './message-renderer'
import {ScrollContainer} from './scroll-container'

const isMe = (message: Message) => {
  return message.role === 'user'
}

const isSystem = (message: Message) => {
  return message.role === 'system'
}

interface Props {
  chatId: number
  messages: Message[]
  partialMessageChunks: string[] | null
}

export const MessageList: FC<Props> = ({
  chatId,
  messages,
  partialMessageChunks
}) => {
  const {query: modelQuery} = useConfigModel()

  const partialMessage: Message | null = partialMessageChunks
    ? {
        id: Math.random(),
        chatId: chatId,
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
          <MessageListItem
            key={message.id}
            message={message}
            modelKey={modelQuery.data?.key ?? null}
            isPartialMessage={message === partialMessage}
          />
        )
      )}
    </ScrollContainer>
  )
}

interface MessageProps {
  message: Message
  modelKey: string | null
  isPartialMessage: boolean
}

const messageClass = cva(['flex gap-4 border-b p-4'], {
  variants: {
    role: {
      user: '',
      assistant: 'bg-gray-100 dark:bg-gray-900',
      system: 'bg-red-50 dark:bg-red-500/10'
    }
  }
})

const modelClass = cva(['flex-none h-6 w-6 rounded-full'], {
  variants: {
    modelKey: {
      'gpt-4': 'bg-black',
      default: 'bg-[#10A37F]'
    }
  },

  defaultVariants: {
    modelKey: 'default'
  }
})

function MessageListItem({message, modelKey, isPartialMessage}: MessageProps) {
  const onContextMenu = () => {
    api.showMessageContextMenu(message.chatId, message.id, isPartialMessage)
  }

  return (
    <div
      onContextMenu={onContextMenu}
      className={messageClass({role: message.role})}
      key={message.id}
    >
      {isMe(message) ? (
        <div className="h-6 w-6 flex-none rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500" />
      ) : isSystem(message) ? (
        <div className="h-6 w-6 flex-none rounded-full bg-gradient-to-br from-violet-500 to-rose-500" />
      ) : (
        <div
          className={modelClass({
            modelKey: modelKey === 'gpt-4' ? modelKey : undefined
          })}
        >
          <OpenAIIcon />
        </div>
      )}

      <div className="mt-0.5 min-w-0">
        <MessageRenderer message={message} />
      </div>
    </div>
  )
}
