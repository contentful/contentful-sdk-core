// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function enforceObjPath(obj: any, path: string): boolean {
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
