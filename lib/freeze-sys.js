import each from 'lodash/each'
import isPlainObject from 'lodash/isPlainObject'

function freezeObjectDeep (obj) {
  each(obj, (value, key) => {
    if (isPlainObject(value)) {
      freezeObjectDeep(value)
    }
  })
  return Object.freeze(obj)
}

export default function freezeSys (obj) {
  freezeObjectDeep(obj.sys)
  return obj
}
