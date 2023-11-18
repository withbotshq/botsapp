import {Message} from '../../shared/schema'
import {FC} from 'react'
import ReactMarkdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import oneDark from '../one-dark'

export const MessageRenderer: FC<{message: Message}> = ({message}) => {
  const onClickCopy = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <ReactMarkdown
      className="markdown break-words"
      components={{
        code(allProps) {
          const {className, children, ref: _ref, ...props} = allProps

          const match = /language-(\w+)/.exec(className || '')
          const language = match?.[1]

          return match ? (
            <div className="rounded border border-gray-700 bg-gray-800 shadow">
              <div className="flex items-center justify-between rounded-t border-b border-gray-700 px-2 py-1">
                <div className="text-xs text-gray-500">{language ?? ''}</div>

                <div>
                  <button
                    onClick={() => {
                      let str: string

                      if (Array.isArray(children)) {
                        str = children.join('').replace(/\n$/, '')
                      } else if (typeof children === 'string') {
                        str = children
                      } else {
                        str = String(children)
                      }

                      onClickCopy(str)
                    }}
                    className="text-xs text-gray-500"
                  >
                    copy
                  </button>
                </div>
              </div>

              <div>
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
            className="overflow-y-auto whitespace-normal font-sans"
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
