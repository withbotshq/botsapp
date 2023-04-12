import {FC, FormEvent, useState} from 'react'
import {SnippetIcon} from './icons'

export const MessageComposer: FC<{onSubmit: (content: string) => void}> = ({
  onSubmit
}) => {
  const [newMessageContent, setNewMessageContent] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newMessageContent === '') return

    onSubmit(newMessageContent)
    setNewMessageContent('')
  }

  return (
    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
      <div className="h-6 w-6 flex-none rounded-full bg-blue-500">
        <SnippetIcon />
      </div>

      <input
        autoFocus
        className="block w-full flex-1 rounded-full border bg-transparent px-3 py-1 outline-none focus:border-gray-600"
        onChange={e => setNewMessageContent(e.target.value)}
        placeholder="Your message..."
        type="text"
        value={newMessageContent}
      />
    </form>
  )
}
