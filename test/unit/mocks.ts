import copy from 'fast-copy'

const linkMock = {
  id: 'linkid',
  type: 'Link',
  linkType: 'linkType',
}

const sysMock = {
  type: 'Type',
  id: 'id',
  space: copy(linkMock),
  createdAt: 'createdatdate',
  updatedAt: 'updatedatdate',
  revision: 1,
}

const contentTypeMock = {
  sys: Object.assign(copy(sysMock), {
    type: 'ContentType',
  }),
  name: 'name',
  description: 'desc',
  displayField: 'displayfield',
  fields: [
    {
      id: 'fieldid',
      name: 'fieldname',
      type: 'Text',
      localized: true,
      required: false,
    },
  ],
}

const entryMock = {
  sys: Object.assign(copy(sysMock), {
    type: 'Entry',
    contentType: Object.assign(copy(linkMock), { linkType: 'ContentType' }),
    locale: 'locale',
  }),
  fields: {
    field1: 'str',
  },
}

const assetMock = {
  sys: Object.assign(copy(sysMock), {
    type: 'Asset',
    locale: 'locale',
  }),
  fields: {
    field1: 'str',
  },
}

const errorMock = {
  config: {
    url: 'requesturl',
    headers: {},
  },
  response: {
    status: 404,
    statusText: 'Not Found',
    data: {},
  },
}

export { linkMock, sysMock, contentTypeMock, entryMock, assetMock, errorMock }
