import { vi, it, expect, Mocked } from 'vitest'

import getUserAgent from '../../src/get-user-agent'
import * as utils from '../../src/utils'

const mockedUtils = utils as Mocked<typeof utils>

vi.mock('../../src/utils', () => ({
  isNode: vi.fn().mockResolvedValue(true),
  isReactNative: vi.fn().mockReturnValue(false),
  getNodeVersion: vi.fn().mockReturnValue('v12.13.1'),
  getWindow: vi.fn().mockReturnValue({
    navigator: {
      platform: 'MacIntel',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36',
    },
  }),
}))

const headerRegEx = /(app|sdk|platform|integration|os) \S+(\/\d+.\d+.\d+(-[\w\d-]+)?)?;/gim

it('Parse node user agent correctly', () => {
  const userAgent = getUserAgent(
    'contentful.js/1.0.0',
    'myApplication/1.0.0',
    'myIntegration/1.0.0',
  )

  // detects node.js platform
  expect(userAgent.indexOf('platform node.js/') !== -1).toBeTruthy()
  // detected valid semver node version
  expect(
    userAgent.match(
      /node\.js\/\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/,
    ),
  ).toBeTruthy()
})

it('Parse browser user agent correctly', () => {
  mockedUtils.isNode.mockReturnValue(false)

  const userAgent = getUserAgent(
    'contentful.js/1.0.0',
    'myApplication/1.0.0',
    'myIntegration/1.0.0',
  )

  expect(userAgent.match(headerRegEx)?.length).toEqual(5)
  expect(userAgent.indexOf('os macOS;') !== -1).toBeTruthy()
  expect(userAgent.indexOf('platform browser;') !== -1).toBeTruthy()
})

it('Fail safely', () => {
  mockedUtils.isNode.mockReturnValue(false)
  // @ts-expect-error intententionally return broken window object
  mockedUtils.getWindow.mockReturnValue({})

  const userAgent = getUserAgent(
    'contentful.js/1.0.0',
    'myApplication/1.0.0',
    'myIntegration/1.0.0',
  )
  expect(userAgent.match(headerRegEx)?.length).toEqual(3)
  // empty os
  expect(userAgent.indexOf('os') === -1).toBeTruthy()
  // empty browser platform
  expect(userAgent.indexOf('platform') === -1).toBeTruthy()
})

it('Parse react native user agent correctly', () => {
  mockedUtils.isNode.mockReturnValue(false)
  mockedUtils.isReactNative.mockReturnValue(true)
  mockedUtils.getWindow.mockReturnValue({
    // @ts-expect-error incomplete navigator object
    navigator: {
      platform: 'ReactNative',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36',
    },
  })

  const userAgent = getUserAgent(
    'contentful.js/1.0.0',
    'myApplication/1.0.0',
    'myIntegration/1.0.0',
  )

  // consists of 4 parts since os is missing in mocked data
  expect(userAgent.match(headerRegEx)?.length).toEqual(4)
  // detects react native platform
  expect(userAgent.indexOf('platform ReactNative') !== -1).toBeTruthy()
})
