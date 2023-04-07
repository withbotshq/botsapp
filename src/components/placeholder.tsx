import {FC} from 'react'

export const Placeholder: FC<{label: string}> = ({label}) => {
  return <div className="grid h-full w-full place-items-center">{label}</div>
}
