/* eslint @typescript-eslint/ban-ts-comment: 0 */

import { isNode, getNodeVersion } from '../../src/utils'

describe('utils-test', () => {
  it('Detects node properly', () => {
    expect(isNode()).toEqual(true)
  })

  it('Detects node properly with babel-polyfill', () => {
    // @ts-ignore
    global.process.browser = true
    // detects non-node environment with babel-polyfill
    expect(isNode()).toEqual(false)
    // property here as it does not exist on type 'Process'.
    // TODO It's unclear why we are using the browser
    // @ts-ignore
    delete global.process.browser
  })

  it('Detects node version', () => {
    const version = getNodeVersion()
    expect(
      version.match(
        /v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/,
      ),
    ).toBeTruthy()
  })
})
