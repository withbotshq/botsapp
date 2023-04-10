import {FC} from 'react'

interface Props {
  setShowInfoPanel: (showInfoPanel: boolean) => void
  showInfoPanel: boolean
}

const TitleBar: FC<Props> = ({showInfoPanel, setShowInfoPanel}) => {
  return (
    <div className="flex items-center px-3">
      <div className="flex-1 p-3 text-center text-gray-500">GPT-4</div>
      <div className="app-region-none flex-none">
        <button
          className="block"
          onClick={() => setShowInfoPanel(!showInfoPanel)}
        >
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
  )
}

export {TitleBar}
