import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import createHttpClient from '../../src/create-http-client'

const mock = new MockAdapter(axios)

const waitASecond = () => new Promise((resolve) => {
    setTimeout(resolve, 1000)
})

mock.onGet('/throttled-call').reply(200, null)

const logHandlerStub = jest.fn()

describe('throttle to rate limit axios interceptor', () => {

    beforeEach(()=> {
        mock.resetHistory();
    })

    it('fires all requests directly', async () => {

        const client = createHttpClient(axios, {
            accessToken: 'token',
            logHandler: logHandlerStub,
            throttle: 0
        })

        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')

        await waitASecond()
        expect(mock.history.get).toHaveLength(8);
    })

    it('fires limited requests per second', async () => {

        const client = createHttpClient(axios, {
            accessToken: 'token',
            logHandler: logHandlerStub,
            throttle: 3
        })

        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')
        client.get('/throttled-call')

        await waitASecond()
        expect(mock.history.get).toHaveLength(3);
    })

})

