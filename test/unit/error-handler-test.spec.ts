// eslint-disable @typescript-eslint/no-explicit-any

import errorHandler from '../../src/error-handler'
import { errorMock } from './mocks'
import { expect } from 'chai'
import cloneDeep from 'lodash/cloneDeep'

const error: any = cloneDeep(errorMock)

describe('A errorHandler', () => {
  // Best case scenario where an error is a known and expected situation and the
  // server returns an error with a JSON payload with all the information possible
  it('Throws well formed error with details from server', async () => {
    error.response.data = {
      sys: {
        id: 'SpecificError',
        type: 'Error',
      },
      message: 'datamessage',
      requestId: 'requestid',
      details: 'errordetails',
    }

    try {
      errorHandler(error)
    } catch (err:any) {
      const parsedMessage = JSON.parse(err.message)
      expect(err.name).equals('SpecificError', 'error name')
      expect(parsedMessage.request.url).equals('requesturl', 'request url')
      expect(parsedMessage.message).equals('datamessage', 'error payload message')
      expect(parsedMessage.requestId).equals('requestid', 'request id')
      expect(parsedMessage.details).equals('errordetails', 'error payload details')
    }
  })

  // Second best case scenario, where we'll still get a JSON payload from the server
  // but only with an Unknown error type and no additional details
  it('Throws unknown error received from server', async () => {
    error.response.data = {
      sys: {
        id: 'Unknown',
        type: 'Error',
      },
      requestId: 'requestid',
    }
    error.response.status = 500
    error.response.statusText = 'Internal'

    try {
      errorHandler(error)
    } catch (err:any) {
      const parsedMessage = JSON.parse(err.message)
      expect(err.name).equals('500 Internal', 'error name defaults to status code and text')
      expect(parsedMessage.request.url).equals('requesturl', 'request url')
      expect(parsedMessage.requestId).equals('requestid', 'request id')
    }
  })

  // Wurst case scenario, where we have no JSON payload and only HTTP status information
  it('Throws error without additional detail', async () => {
    error.response.status = 500
    error.response.statusText = 'Everything is on fire'

    try {
      errorHandler(error)
    } catch (err:any) {
      const parsedMessage = JSON.parse(err.message)
      expect(err.name).equals(
        '500 Everything is on fire',
        'error name defaults to status code and text'
      )
      expect(parsedMessage.request.url).equals('requesturl', 'request url')
    }
  })

  it('Obscures token in any error message', async () => {
    const responseError: any = cloneDeep(errorMock)
    responseError.config.headers = {
      Authorization: 'Bearer secret-token',
    }

    try {
      errorHandler(responseError)
    } catch (err:any) {
      const parsedMessage = JSON.parse(err.message)
      expect(parsedMessage.request.headers.Authorization).equals(
        'Bearer ...token',
        'Obscures token'
      )
    }

    const requestError: any = {
      config: {
        url: 'requesturl',
        headers: {},
      },
      data: {},
      request: {
        status: 404,
        statusText: 'Not Found',
      },
    }

    requestError.config.headers = {
      Authorization: 'Bearer secret-token',
    }

    try {
      errorHandler(requestError)
    } catch (err:any) {
      expect(err.config.headers.Authorization).equals('Bearer ...token', 'Obscures token')
    }
  })
})
