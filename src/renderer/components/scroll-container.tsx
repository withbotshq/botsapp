import {assert} from '@jclem/assert'
import {FC, PropsWithChildren, useEffect, useRef} from 'react'

export const ScrollContainer: FC<PropsWithChildren> = ({children}) => {
  const shouldScrollRef = useRef(true)
  const outerDiv = useRef<HTMLDivElement>(null)
  const innerDiv = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shouldScrollRef.current) {
      return
    }

    const outerDivEl = assert(outerDiv.current)
    const innerDivEl = assert(innerDiv.current)

    const outerHeight = outerDivEl.clientHeight
    const innerHeight = innerDivEl.clientHeight

    outerDivEl.scrollTo({
      top: innerHeight - outerHeight,
      left: 0
    })
  }, [children])

  useEffect(() => {
    const el = assert(outerDiv.current)
    if (!el) return

    el.addEventListener('scroll', () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 1) {
        shouldScrollRef.current = true
      } else {
        shouldScrollRef.current = false
      }
    })
  }, [])

  return (
    <div className="h-full overflow-hidden">
      <div
        className="relative h-full overflow-auto overscroll-contain"
        ref={outerDiv}
      >
        <div className="relative" ref={innerDiv}>
          {children}
        </div>
      </div>
    </div>
  )
}
