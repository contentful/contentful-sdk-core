import { platform, release } from 'os'

import { isNode, getNodeVersion, isReactNative, getWindow } from './utils'

function getBrowserOS(): string | null {
  const win = getWindow()
  if (!win) {
    return null
  }
  const userAgent = win.navigator.userAgent
  const platform = win.navigator.platform
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

function getNodeOS(): string | null {
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
    win32: 'Windows',
  }
  if (os in osMap) {
    // @ts-expect-error
    return `${osMap[os] || 'Linux'}/${version}`
  }
  return null
}

export default function getUserAgentHeader(
  sdk: string,
  application?: string,
  integration?: string,
  feature?: string
): string {
  const headerParts = []

  if (application) {
    headerParts.push(`app ${application}`)
  }

  if (integration) {
    headerParts.push(`integration ${integration}`)
  }

  if (feature) {
    headerParts.push('feature ' + feature)
  }

  headerParts.push(`sdk ${sdk}`)

  let os = null
  try {
    if (isReactNative()) {
      os = getBrowserOS()
      headerParts.push('platform ReactNative')
    } else if (isNode()) {
      os = getNodeOS()
      headerParts.push(`platform node.js/${getNodeVersion()}`)
    } else {
      os = getBrowserOS()
      headerParts.push('platform browser')
    }
  } catch (e) {
    os = null
  }

  if (os) {
    headerParts.push(`os ${os}`)
  }

  return `${headerParts.filter((item) => item !== '').join('; ')};`
}
