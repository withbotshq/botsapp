/**
 * This hook is part of Primer React.
 * https://github.com/primer/react/blob/main/src/hooks/useSlots.ts
 */

import {assert} from '@jclem/assert'
import {
  Children,
  ComponentType,
  ReactElement,
  ReactNode,
  isValidElement
} from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SlotConfig = Record<string, ComponentType<any>>

type SlotElements<Type extends SlotConfig> = {
  [Property in keyof Type]: ReactElement
}

/**
 * Extract components from `children` so we can render them in different places,
 * allowing us to implement components with SSR-compatible slot APIs.
 * Note: We can only extract direct children, not nested ones.
 */
export function useSlots<T extends SlotConfig>(
  children: ReactNode,
  config: T
): [Partial<SlotElements<T>>, ReactNode[]] {
  // Object mapping slot names to their elements
  const slots: Partial<SlotElements<T>> = mapValues(config, () => undefined)

  // Array of elements that are not slots
  const rest: ReactNode[] = []

  const keys = Object.keys(config) as Array<keyof T>
  const values = Object.values(config)

  Children.forEach(children, child => {
    if (!isValidElement(child)) {
      rest.push(child)
      return
    }

    const index = values.findIndex(value => {
      return child.type === value
    })

    // If the child is not a slot, add it to the `rest` array
    if (index === -1) {
      rest.push(child)
      return
    }

    const slotKey = assert(keys[index])

    // If slot is already filled, ignore duplicates
    if (slots[slotKey]) {
      // warning(true, `Found duplicate "${String(slotKey)}" slot. Only the first will be rendered.`)
      return
    }

    // If the child is a slot, add it to the `slots` object
    slots[slotKey] = child
  })

  return [slots, rest]
}

/** Map the values of an object */
function mapValues<T extends Record<string, unknown>, V>(
  obj: T,
  fn: (value: T[keyof T]) => V
) {
  return Object.keys(obj).reduce((result, key: keyof T) => {
    result[key] = fn(obj[key])
    return result
  }, {} as Record<keyof T, V>)
}
