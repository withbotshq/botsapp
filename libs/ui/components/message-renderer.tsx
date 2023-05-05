import {MessageBase} from '@withbotshq/shared/schema'
import {FC} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const MessageRenderer: FC<{message: Pick<MessageBase, 'content'>}> = ({
  message
}) => {
  const onClickCopy = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <ReactMarkdown
      className="markdown break-words"
      components={{
        code({inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '')
          const language = match?.[1]

          return !inline && match ? (
            <div className="rounded border border-gray-700 bg-gray-800 shadow">
              <div className="flex items-center justify-between rounded-t border-b border-gray-700 px-2 py-1">
                <div className="text-xs text-gray-500">{language ?? ''}</div>

                <div>
                  <button
                    onClick={() =>
                      onClickCopy(children.join('').replace(/\n$/, ''))
                    }
                    className="text-xs text-gray-500"
                  >
                    copy
                  </button>
                </div>
              </div>

              <div>{String(children).replace(/\n$/, '')}</div>
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
