

export function isNode (): boolean {
  /**
   * Polyfills of 'process' might set process.browser === true
   *
   * See:
   * https://github.com/webpack/node-libs-browser/blob/master/mock/process.js#L8
   * https://github.com/defunctzombie/node-process/blob/master/browser.js#L156
  **/
  return typeof process !== 'undefined' && !process.browser
}

export function getNodeVersion (): string {
  return process.versions && process.versions.node ? `v${process.versions.node}` : process.version
}
