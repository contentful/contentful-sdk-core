import has from 'lodash/has'

export default function enforceObjPath (obj, path) {
  if (!has(obj, path)) {
    const err = new Error()
    err.name = 'PropertyMissing'
    err.message = `Required property ${path} missing from:

${JSON.stringify(obj)}

`
    throw err
  }
  return true
}
