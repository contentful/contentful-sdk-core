import { it, expect, describe } from 'vitest'
import { isNode, getNodeVersion } from '../../src/utils'

describe('utils-test', () => {
  it('Detects node properly', () => {
    expect(isNode()).toEqual(true)
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
