import {FC, PropsWithChildren, useEffect, useRef} from 'react'

export const ScrollContainer: FC<PropsWithChildren> = ({children}) => {
  const outerDiv = useRef<HTMLDivElement>(null)
  const innerDiv = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const outerHeight = outerDiv.current!.clientHeight
    const innerHeight = innerDiv.current!.clientHeight

    outerDiv.current!.scrollTo({
      top: innerHeight - outerHeight,
      left: 0,
      behavior: 'smooth'
    })
  }, [children])

  return (
    <div className="h-full overflow-hidden">
      <div
        className="relative h-full overflow-scroll overscroll-contain"
        ref={outerDiv}
      >
        <div className="relative" ref={innerDiv}>
          {children}
        </div>
      </div>
    </div>
  )
}
