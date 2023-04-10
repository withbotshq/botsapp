import {ReactNode} from 'react'
import {useSlots} from '../hooks/useSlots'

const Left = ({children}: {children: ReactNode}) => <>{children}</>
const Right = ({children}: {children: ReactNode}) => <>{children}</>

const AppWindow = ({children}: {children: ReactNode | ReactNode[]}) => {
  const [slots] = useSlots(children, {left: Left, right: Right})

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 overflow-hidden">
      <div className="flex h-full">
        <div className="w-[280px] border-r">{slots.left}</div>

        <div className="flex-1">{slots.right}</div>
      </div>
    </div>
  )
}

AppWindow.Left = Left
AppWindow.Right = Right

export {AppWindow}