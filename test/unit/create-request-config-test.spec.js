import createRequestConfig from '../../src/create-request-config'

it('Create request config', () => {
  const config = createRequestConfig({
    query: {
      resolveLinks: true,
    },
  })

  expect(config.params).toBeDefined()
  // resolveLinks property is removed from query
  expect(config.params.resolveLinks).not.toBeDefined()
})
