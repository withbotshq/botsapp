import {cva} from 'class-variance-authority'
import {FC, PropsWithChildren} from 'react'

// Standard HTMLButtonElement props.
type Props = PropsWithChildren<JSX.IntrinsicElements['button']>

const buttonClass = cva(['rounded px-2 py-1'], {
  variants: {
    disabled: {
      true: 'bg-gray-300 text-gray-500',
      false: 'bg-blue-500 text-white'
    }
  },
  defaultVariants: {
    disabled: false
  }
})

const Button: FC<Props> = props => {
  const {disabled} = props
  return <button className={buttonClass({disabled})} {...props} />
}

export {Button}
