import {FC} from 'react'
import ReactMarkdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import {Message} from '../db/schema'
import oneDark from '../one-dark'

export const MessageRenderer: FC<{message: Message}> = ({message}) => {
  return (
    <span
      className={`rounded-2xl text-white px-3 py-1 ${
        message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
      }`}
    >
      <ReactMarkdown
        components={{
          code({inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match?.[1]

            return !inline && match ? (
              <div className="rounded border">
                <div className="flex justify-between bg-gray-900 px-2 py-1">
                  <div>{language ?? ''}</div>

                  <div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M18.25 12L5.75 5.75V18.25L18.25 12Z"
                      ></path>
                    </svg>
                  </div>
                </div>

                <div>
                  <SyntaxHighlighter
                    {...props}
                    language={language}
                    PreTag="div"
                    style={oneDark}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            )
          },
          // FIXME: There must be a better way to avoid a `pre` tag around code blocks.
          pre: ({...props}) => (
            <pre className="whitespace-normal font-sans" {...props} />
          )
        }}
        remarkPlugins={[remarkGfm]}
      >
        {message.content}
      </ReactMarkdown>
    </span>
  )
}
