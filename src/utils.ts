export function isNode(): boolean {
  /**
   * Save way to check for the global scope which should confirm if an environment is node
   * For reference: https://stackoverflow.com/a/31090240
   */
  const isNodeFunc = new Function('try {return this===global;}catch(e){return false;}')
  return isNodeFunc()
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
