import test from 'blue-tape'
import sinon from 'sinon'

import createHttpClient, {__RewireAPI__ as createHttpClientRewireApi} from '../../lib/create-http-client'

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

let mock
function setup () {
  mock = new MockAdapter(axios)
  createHttpClientRewireApi.__Rewire__('rateLimit', sinon.stub())
  axios.create = sinon.stub().returns({})
}
function teardown () {
  createHttpClientRewireApi.__ResetDependency__('rateLimit')
  mock.reset()
}

test('Calls axios with expected URL', t => {
  setup()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    space: 'clientSpaceId',
    defaultHostname: 'defaulthost'
  })

  t.equals(axios.create.args[0][0].baseURL, 'https://defaulthost:443/spaces/clientSpaceId/')
  teardown()
  t.end()
})
