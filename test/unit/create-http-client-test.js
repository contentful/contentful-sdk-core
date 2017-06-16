import test from 'blue-tape'
import sinon from 'sinon'

import createHttpClient, {__RewireAPI__ as createHttpClientRewireApi} from '../../lib/create-http-client'

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)
function setup () {
  createHttpClientRewireApi.__Rewire__('rateLimit', sinon.stub())
  sinon.stub(axios, 'create').returns({})
}
function teardown () {
  createHttpClientRewireApi.__ResetDependency__('rateLimit')
  mock.reset()
  axios.create.restore()
}

test('Calls axios with expected default URL', t => {
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

test('Calls axios based on passed host', t => {
  setup()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:8080'
  })

  t.equals(axios.create.args[0][0].baseURL, 'https://contentful.com:8080/spaces/')
  teardown()
  t.end()
})

test('Calls axios based on passed host with insecure flag', t => {
  setup()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:321',
    insecure: true
  })

  t.equals(axios.create.args[0][0].baseURL, 'http://contentful.com:321/spaces/')
  teardown()
  t.end()
})

test('Calls axios based on passed hostname with insecure flag', t => {
  setup()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com',
    insecure: true
  })

  t.equals(axios.create.args[0][0].baseURL, 'http://contentful.com:80/spaces/')
  teardown()
  t.end()
})
