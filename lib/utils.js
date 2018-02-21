export function isNode () {
  return typeof process !== 'undefined'
}

export function getNodeVersion () {
  return process.versions.node ? `v${process.versions.node}` : process.version
}
