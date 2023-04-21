import {ReactNode} from 'react'
import {useSlots} from '../hooks/use-slots'

const Left = ({children}: {children: ReactNode}) => <>{children}</>
const Right = ({children}: {children: ReactNode}) => <>{children}</>

const AppWindow = ({children}: {children: ReactNode | ReactNode[]}) => {
  const [slots] = useSlots(children, {left: Left, right: Right})

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 overflow-hidden">
      <div className="flex h-full">
        <div className="min-h-0 w-[280px] min-w-0 border-r border-black/10 dark:border-white/10">
          {slots.left}
        </div>

        <div className="min-h-0 min-w-0 flex-1 bg-canvas">{slots.right}</div>
      </div>
    </div>
  )
}

AppWindow.Left = Left
AppWindow.Right = Right

export {AppWindow}
