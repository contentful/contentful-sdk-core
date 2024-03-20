import errorHandler from '../../src/error-handler'
import { errorMock } from './mocks'
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
    } catch (err: any) {
      const parsedMessage = JSON.parse(err.message)
      expect(err.name).toBe('SpecificError')
      expect(parsedMessage.request.url).toBe('requesturl')
      expect(parsedMessage.message).toBe('datamessage')
      expect(parsedMessage.requestId).toBe('requestid')
      expect(parsedMessage.details).toBe('errordetails')
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
    } catch (err: any) {
      const parsedMessage = JSON.parse(err.message)
      expect(err.name).toBe('500 Internal')
      expect(parsedMessage.request.url).toBe('requesturl')
      expect(parsedMessage.requestId).toBe('requestid')
    }
  })

  // Wurst case scenario, where we have no JSON payload and only HTTP status information
  it('Throws error without additional detail', async () => {
    error.response.status = 500
    error.response.statusText = 'Everything is on fire'

    try {
      errorHandler(error)
    } catch (err: any) {
      const parsedMessage = JSON.parse(err.message)
      expect(err.name).toBe('500 Everything is on fire')
      expect(parsedMessage.request.url).toBe('requesturl')
    }
  })

  it('Obscures token in any error message', async () => {
    const responseError: any = cloneDeep(errorMock)
    responseError.config.headers = {
      Authorization: 'Bearer secret-token',
    }

    try {
      errorHandler(responseError)
    } catch (err: any) {
      const parsedMessage = JSON.parse(err.message)
      expect(parsedMessage.request.headers.Authorization).toBe('Bearer ...token')
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
    } catch (err: any) {
      expect(err.config.headers.Authorization).toBe('Bearer ...token')
    }
  })
})
