import test from 'blue-tape'
import sinon from 'sinon'

import createHttpClient, {__RewireAPI__ as createHttpClientRewireApi} from '../../lib/create-http-client'

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const logHandlerStub = sinon.stub()
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
    defaultHostname: 'defaulthost',
    logHandler: logHandlerStub
  })

  t.equals(axios.create.args[0][0].baseURL, 'https://defaulthost:443/spaces/clientSpaceId/')
  t.equals(logHandlerStub.callCount, 0, 'does not log anything')
  teardown()
  t.end()
})

test('Calls axios based on passed host', t => {
  setup()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:8080',
    logHandler: logHandlerStub
  })

  t.equals(axios.create.args[0][0].baseURL, 'https://contentful.com:8080/spaces/')
  t.equals(logHandlerStub.callCount, 0, 'does not log anything')
  teardown()
  t.end()
})

test('Calls axios based on passed host with insecure flag', t => {
  setup()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com:321',
    insecure: true,
    logHandler: logHandlerStub
  })

  t.equals(axios.create.args[0][0].baseURL, 'http://contentful.com:321/spaces/')
  t.equals(logHandlerStub.callCount, 0, 'does not log anything')
  teardown()
  t.end()
})

test('Calls axios based on passed hostname with insecure flag', t => {
  setup()
  createHttpClient(axios, {
    accessToken: 'clientAccessToken',
    host: 'contentful.com',
    insecure: true,
    logHandler: logHandlerStub
  })

  t.equals(axios.create.args[0][0].baseURL, 'http://contentful.com:80/spaces/')
  t.equals(logHandlerStub.callCount, 0, 'does not log anything')
  teardown()
  t.end()
})

test('Fails with missing access token', t => {
  setup()
  try {
    createHttpClient(axios, {
      logHandler: logHandlerStub
    })
    t.fail('should fail')
    teardown()
    t.end()
  } catch (err) {
    t.ok(err instanceof TypeError, 'throws a TypeError')
    t.equals(err.message, 'Expected parameter accessToken')
    t.equals(logHandlerStub.callCount, 1, 'logs only once')
    t.equals(logHandlerStub.args[0][0], 'error', 'logs an error')
    t.equals(logHandlerStub.args[0][1].message, 'Expected parameter accessToken', 'logged error has correct message')
    t.ok(logHandlerStub.args[0][1] instanceof TypeError, 'logs a TypeError')
    teardown()
    t.end()
  }
})
