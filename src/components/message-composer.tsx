import {FC, FormEvent, useState} from 'react'

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
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.75 13.25H6.75L13.25 4.75V10.75H17.25L10.75 19.25V13.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </div>

      <input
        className="block w-full flex-1 rounded-full border bg-transparent px-3 py-1 outline-none focus:border-gray-600"
        onChange={(e) => setNewMessageContent(e.target.value)}
        placeholder="Your message..."
        type="text"
        value={newMessageContent}
      />
    </form>
  )
}
