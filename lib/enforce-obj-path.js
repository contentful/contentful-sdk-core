export default function enforceObjPath (obj, path) {
  if (!(path in obj)) {
    const err = new Error()
    err.name = 'PropertyMissing'
    err.message = `Required property ${path} missing from:

${JSON.stringify(obj)}

`
    throw err
  }
  return true
}
