import {cva} from 'class-variance-authority'
import {FC, ReactNode} from 'react'

interface Props {
  active?: boolean
  icon: ReactNode
  onClick: () => void
}

const buttonClass = cva(['block rounded'], {
  variants: {
    active: {
      true: 'text-blue-500 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900',
      false: 'text-gray-400 hover:text-gray-500'
    }
  },
  defaultVariants: {
    active: false
  }
})

const IconButton: FC<Props> = ({active, icon, onClick}) => {
  return (
    <button className={buttonClass({active})} onClick={onClick}>
      {icon}
    </button>
  )
}

export {IconButton}
