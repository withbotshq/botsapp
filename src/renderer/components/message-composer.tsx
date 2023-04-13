import {assert} from '@jclem/assert'
import {FC, useState} from 'react'
import {SnippetIcon} from './icons'

export const MessageComposer: FC<{onSubmit: (content: string) => void}> = ({
  onSubmit
}) => {
  const [newMessageContent, setNewMessageContent] = useState('')

  const submitForm = () => {
    if (newMessageContent === '') return

    onSubmit(newMessageContent)
    setNewMessageContent('')
  }

  return (
    <form
      className="flex items-start gap-2"
      onSubmit={e => {
        e.preventDefault()
        submitForm()
      }}
    >
      <div className="h-6 w-6 flex-none rounded-full bg-blue-500">
        <SnippetIcon />
      </div>

      <div className="grow-wrap">
        <textarea
          autoFocus
          rows={1}
          className="block w-full flex-1 rounded-full border bg-transparent px-3 py-1 outline-none focus:border-border-focus"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              assert(e.currentTarget.parentElement).dataset.replicatedValue = ''
              submitForm()
            }
          }}
          onChange={e => {
            setNewMessageContent(e.target.value)
            assert(e.currentTarget.parentElement).dataset.replicatedValue =
              e.currentTarget.value
          }}
          placeholder="Your message..."
          value={newMessageContent}
        />
      </div>
    </form>
  )
}
