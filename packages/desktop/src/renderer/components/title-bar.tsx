import {FC} from 'react'
import {SettingsIcon} from './icons'

interface Props {
  title: string
  setShowInfoPanel: (showInfoPanel: boolean) => void
  showInfoPanel: boolean
}

const TitleBar: FC<Props> = ({title, showInfoPanel, setShowInfoPanel}) => {
  return (
    <div className="flex items-center px-3">
      <div className="flex-1 p-3 text-center text-gray-500">{title}</div>
      <div className="app-region-none flex-none">
        <button
          className="block"
          onClick={() => setShowInfoPanel(!showInfoPanel)}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  )
}

export {TitleBar}
