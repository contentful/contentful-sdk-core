import { isNode, getNodeVersion } from '../../src/utils'

describe('utils-test', () => {
  it('Detects node properly', () => {
    expect(isNode()).toEqual(true)
  })

  it('Detects node properly with babel-polyfill', () => {
    global.process.browser = true
    // detects non-node environment with babel-polyfill
    expect(isNode()).toEqual(false)
    delete global.process.browser
  })

  it('Detects node version', () => {
    const version = getNodeVersion()
    expect(
      version.match(
        /v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/
      )
    ).toBeTruthy()
  })
})
