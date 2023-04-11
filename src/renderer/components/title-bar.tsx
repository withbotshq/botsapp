import {useQuery} from '@tanstack/react-query'
import {FC} from 'react'
import {SettingsIcon} from './icons'

interface Props {
  setShowInfoPanel: (showInfoPanel: boolean) => void
  showInfoPanel: boolean
}

const TitleBar: FC<Props> = ({showInfoPanel, setShowInfoPanel}) => {
  const modelQuery = useQuery({
    queryKey: ['config:model'],
    queryFn: api.getModel
  })

  return (
    <div className="flex items-center px-3">
      <div className="flex-1 p-3 text-center text-gray-500">
        {modelQuery.data?.title ?? ''}
      </div>
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
