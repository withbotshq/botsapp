import {BrowserWindow} from 'electron'

export class WindowController {
  #activeWindows: Set<BrowserWindow> = new Set()

  addBrowserWindow(window: BrowserWindow): BrowserWindow {
    this.#activeWindows.add(window)
    window.on('closed', () => this.#activeWindows.delete(window))
    return window
  }

  get windows(): BrowserWindow[] {
    return Array.from(this.#activeWindows)
  }
}
