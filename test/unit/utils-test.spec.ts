import { vi, MockedObject, it, expect, describe } from 'vitest'
import process from 'process'

import { isNode, getNodeVersion } from '../../src/utils'

describe('utils-test', () => {
  it('Detects node properly', () => {
    expect(isNode()).toEqual(true)
  })

  it('Detects node properly with babel-polyfill', () => {
    vi.mock('process')
    const mockedProcess = process as MockedObject<typeof process>
    // @ts-expect-error
    mockedProcess.browser = true
    // detects non-node environment with babel-polyfill
    expect(isNode()).toEqual(false)
    // @ts-expect-error
    mockedProcess.browser = false
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
