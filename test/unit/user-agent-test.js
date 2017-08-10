import test from 'blue-tape'
import getUserAgent, {__RewireAPI__ as getUserAgentRewireApi} from '../../lib/get-user-agent'

const headerRegEx = /(app|sdk|platform|integration|os) \S+(\/\d+.\d+.\d+(-[\w\d-]+)?)?;/igm

test('Parse node user agent correctly', (t) => {
  const userAgent = getUserAgent('contentful.js/1.0.0', 'myApplication/1.0.0', 'myIntegration/1.0.0')
  t.equal(userAgent.match(headerRegEx).length, 5, 'consists of 5 parts')
  t.true(userAgent.indexOf('platform node.js/') !== -1, 'detects node.js platform')
  t.end()
})

test('Parse browser user agent correctly', (t) => {
  // Fake browser environment
  getUserAgentRewireApi.__Rewire__('isNode', () => false)
  getUserAgentRewireApi.__Rewire__('isReactNative', () => false)
  global.window = {
    navigator: {
      platform: 'MacIntel'
    }
  }

  const userAgent = getUserAgent('contentful.js/1.0.0', 'myApplication/1.0.0', 'myIntegration/1.0.0')
  t.equal(userAgent.match(headerRegEx).length, 5, 'consists of 5 parts')
  t.true(userAgent.indexOf('os macOS;') !== -1, 'detects correct os')
  t.true(userAgent.indexOf('platform browser;') !== -1, 'detects browser platform')
  t.end()
  getUserAgentRewireApi.__ResetDependency__('isNode')
  getUserAgentRewireApi.__ResetDependency__('isReactNative')
  getUserAgentRewireApi.__ResetDependency__('window')
})

test('Parse react native user agent correctly', (t) => {
  // Fake react native environment
  getUserAgentRewireApi.__Rewire__('isNode', () => false)
  getUserAgentRewireApi.__Rewire__('isReactNative', () => true)
  global.window = {
    navigator: {
      product: 'ReactNative'
    }
  }

  const userAgent = getUserAgent('contentful.js/1.0.0', 'myApplication/1.0.0', 'myIntegration/1.0.0')
  t.equal(userAgent.match(headerRegEx).length, 4, 'consists of 4 parts since os is missing in mocked data')
  t.true(userAgent.indexOf('platform ReactNative') !== -1, 'detects react native platform')
  t.end()

  getUserAgentRewireApi.__ResetDependency__('isNode')
  getUserAgentRewireApi.__ResetDependency__('isReactNative')
  getUserAgentRewireApi.__ResetDependency__('window')
})
