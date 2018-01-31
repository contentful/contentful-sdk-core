import { platform, release } from 'os'

function isReactNative () {
  return typeof window !== 'undefined' && 'navigator' in window && 'product' in window.navigator && window.navigator.product === 'ReactNative'
}

export function isNode () {
  return typeof process !== 'undefined'
}

export function getNodeVersion () {
  return process.versions.node ? `v${process.versions.node}` : process.version
}

function getBrowserOS () {
  if (!window) {
    return null
  }
  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
  const iosPlatforms = ['iPhone', 'iPad', 'iPod']
  let os = null

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'macOS'
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'iOS'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows'
  } else if (/Android/.test(userAgent)) {
    os = 'Android'
  } else if (/Linux/.test(platform)) {
    os = 'Linux'
  }

  return os
}

function getNodeOS () {
  const os = platform() || 'linux'
  const version = release() || '0.0.0'
  const osMap = {
    android: 'Android',
    aix: 'Linux',
    darwin: 'macOS',
    freebsd: 'Linux',
    linux: 'Linux',
    openbsd: 'Linux',
    sunos: 'Linux',
    win32: 'Windows'
  }
  if (os in osMap) {
    return `${osMap[os] || 'Linux'}/${version}`
  }
  return null
}

export default function getUserAgentHeader (sdk, application, integration) {
  const headerParts = []

  if (application) {
    headerParts.push(`app ${application}`)
  }

  if (integration) {
    headerParts.push(`integration ${integration}`)
  }

  headerParts.push(`sdk ${sdk}`)

  let os = null
  if (isReactNative()) {
    os = getBrowserOS()
    headerParts.push('platform ReactNative')
  } else if (isNode()) {
    os = getNodeOS()
    headerParts.push(`platform node.js/${getNodeVersion()}`)
  } else {
    os = getBrowserOS()
    headerParts.push(`platform browser`)
  }

  if (os) {
    headerParts.push(`os ${os}`)
  }

  return `${headerParts.filter((item) => item !== '').join('; ')};`
}
