import {assert} from '@jclem/assert'
import {FC, useState} from 'react'

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
      onSubmit={e => {
        e.preventDefault()
        submitForm()
      }}
    >
      <div className="grow-wrap">
        <textarea
          autoFocus
          rows={1}
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
