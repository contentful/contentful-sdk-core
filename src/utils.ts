import process from 'process'

export function isNode(): boolean {
  /**
   * Polyfills of 'process' might set process.browser === true
   *
   * See:
   * https://github.com/webpack/node-libs-browser/blob/master/mock/process.js#L8
   * https://github.com/defunctzombie/node-process/blob/master/browser.js#L156
   **/
  return typeof process !== 'undefined' && !process.browser
}

export function isReactNative(): boolean {
  return (
    typeof window !== 'undefined' &&
    'navigator' in window &&
    'product' in window.navigator &&
    window.navigator.product === 'ReactNative'
  )
}

export function getNodeVersion(): string {
  return process.versions && process.versions.node ? `v${process.versions.node}` : process.version
}

export function getWindow(): Window {
  return window
}

export function noop(): undefined {
  return undefined
}
