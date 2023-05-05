import {MessageRenderer} from '@withbotshq/ui/components/message-renderer'
import {FC, use} from 'react'
import {getChatByUUID, getChatMessagesByUUID} from '~/db'

const SharedChatPage: FC<{params: {uuid: string}}> = ({params: {uuid}}) => {
  const [chat, chatMessages] = use(
    Promise.all([getChatByUUID(uuid), getChatMessagesByUUID(uuid)])
  )

  return (
    <div>
      <h1>{chat.name}</h1>
      <ul>
        {chatMessages.map((message) => (
          <li key={message.id}>
            <MessageRenderer message={message} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SharedChatPage
