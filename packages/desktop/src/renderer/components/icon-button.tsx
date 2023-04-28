import {FC, ReactNode} from 'react'
import {cva} from 'class-variance-authority'

interface Props {
  active?: boolean
  icon: ReactNode
  onClick: () => void
}

const buttonClass = cva(['block rounded'], {
  variants: {
    active: {
      true: 'text-blue-500 bg-blue-100 hover:bg-blue-200',
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
