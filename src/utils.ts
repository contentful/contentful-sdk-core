export function isNode(): boolean {
  return Boolean(typeof process !== 'undefined' && process.versions?.node)
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
