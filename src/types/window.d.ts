import type {API} from '../preload'

declare global {
  const api: typeof API
}
