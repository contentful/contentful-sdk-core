import { isNode, getNodeVersion } from '../../src/utils'

describe('utils-test', () => {
  it('Detects node properly', () => {
    expect(isNode()).toEqual(true)
  })

  // it('Detects node properly with babel-polyfill', (t) => {
  //   global.process.browser = true
  //   t.equals(isNode(), false, 'detects non-node environment with babel-polyfill')
  //   delete global.process.browser
  //   t.end()
  // })

  it('Detects node version', () => {
    const version = getNodeVersion()
    expect(
      version.match(
        /v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/
      )
    ).toBeTruthy()
  })
})
