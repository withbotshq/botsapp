import {FC, useState} from 'react'
import {Message, initialMessages} from '../models/message'
import {ChatSettings} from './chat-settings'
import {MessageComposer} from './message-composer'
import {MessageList} from './message-list'

export const App: FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(false)

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0">
      <div className="flex h-full">
        <div className="flex h-full w-full flex-1 flex-col">
          <div className="flex-none border-b">
            <div className="flex items-center px-3">
              <div className="flex-none" />
              <div className="flex-1 p-3 text-center text-gray-500">
                My First GPT-3 Conversation
                <span className="text-gray-700">.chat</span>
              </div>
              <div className="flex-none">
                <button onClick={() => setShowInfoPanel(!showInfoPanel)}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4.75 8H7.25"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12.75 8H19.25"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4.75 16H12.25"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M17.75 16H19.25"
                    ></path>
                    <circle
                      cx="10"
                      cy="8"
                      r="2.25"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    ></circle>
                    <circle
                      cx="15"
                      cy="16"
                      r="2.25"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    ></circle>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* FIXME: Ideally, the `overflow-hidden` isn't necessary here. This should be the concern of the `ScrollContainer` */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <MessageList messages={messages} />

            <div className="flex-none border-t p-3">
              <MessageComposer
                onSubmit={content =>
                  setMessages([
                    ...messages,
                    {
                      id: String(messages.length + 1),
                      author: '1',
                      content,
                      special: false
                    }
                  ])
                }
              />
            </div>
          </div>
        </div>

        {showInfoPanel && (
          <div className="w-1/3 border-l">
            <ChatSettings />
          </div>
        )}
      </div>
    </div>
  )
}
