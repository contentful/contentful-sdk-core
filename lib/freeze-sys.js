import isPlainObject from 'lodash/isPlainObject'

function freezeObjectDeep (obj) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    if (isPlainObject(value)) {
      freezeObjectDeep(value)
    }
  })
  return Object.freeze(obj)
}

export default function freezeSys (obj) {
  freezeObjectDeep(obj.sys || {})
  return obj
}
