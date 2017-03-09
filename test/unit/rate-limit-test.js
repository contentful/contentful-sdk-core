import test from 'blue-tape'
import { spy } from 'sinon'

import rateLimit from '../../lib/rate-limit'
import axios from 'axios'
let MockAdapter = require('axios-mock-adapter')
let mock
function setup () {
  mock = new MockAdapter(axios)
  rateLimit(axios)
}
function teardown () {
  mock.reset()
}
test('Retry on 429', (t) => {
  setup()
  mock.onGet('/rate-limit-me').replyOnce(429, {headers: {'X-Contentful-RateLimit-Reset': 2}})
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  t.plan(2)
  return axios.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    teardown()
  })
})
test('Retry on 500', (t) => {
  setup()
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(500)
  mock.onGet('/rate-limit-me').replyOnce(200, 'works')
  t.plan(2)
  return axios.get('/rate-limit-me').then((response) => {
    t.ok(response.data)
    t.equals(response.data, 'works')
    teardown()
  })
})

