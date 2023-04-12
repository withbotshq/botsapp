import {FC} from 'react'
import ReactMarkdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import {Message} from '../../main/db/schema'
import oneDark from '../one-dark'

export const MessageRenderer: FC<{message: Message}> = ({message}) => {
  return (
    <ReactMarkdown
      className="markdown"
      components={{
        code({inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '')
          const language = match?.[1]

          return !inline && match ? (
            <div className="overflow-hidden rounded border border-gray-700 bg-gray-800 shadow">
              <div className="rounded-t border-b border-gray-700 px-2 py-1">
                <div className="text-xs text-gray-500">{language ?? ''}</div>
              </div>

              <div className="overflow-hidden">
                <SyntaxHighlighter
                  {...props}
                  className={className}
                  language={language}
                  PreTag="pre"
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
          <pre
            className="x-this-is-pre overflow-y-scroll whitespace-normal font-sans"
            {...props}
          />
        )
      }}
      remarkPlugins={[remarkGfm]}
    >
      {message.content}
    </ReactMarkdown>
  )
}
