import test from 'blue-tape'
import getUserAgent from '../../lib/get-user-agent'

test('Parse User agent correctly', (t) => {
  t.plan(1)
  const headerRegEx = /(app|sdk|platform|integration|os) (\S+\/\d.\d.\d)(-\w+)?/igm
  const userAgent = getUserAgent('contentful.js/1.0.0', 'myApplication/1.0.0', 'myIntegration/1.0.0')
  t.equal(userAgent.match(headerRegEx).length, 5)
})
