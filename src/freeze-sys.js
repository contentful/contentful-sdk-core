import {each} from 'lodash/collection'
import {isPlainObject} from 'lodash/lang'

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
