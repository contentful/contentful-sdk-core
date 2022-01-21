import { isNode, getNodeVersion, isReactNative, getWindow } from './utils'

function getBrowserOS(): string | null {
  const win = getWindow()
  if (!win) {
    return null
  }
  const userAgent = win.navigator.userAgent
  // TODO: platform is deprecated.
  const platform = win.navigator.platform
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
  const iosPlatforms = ['iPhone', 'iPad', 'iPod']

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'macOS'
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'iOS'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'Windows'
  } else if (/Android/.test(userAgent)) {
    return 'Android'
  } else if (/Linux/.test(platform)) {
    return 'Linux'
  }

  return null
}

type PlatformMap = Record<string, 'Android' | 'Linux' | 'Windows' | 'macOS'>

function getNodeOS(): string | null {
  const platform = process.platform || 'linux'
  const version = process.version || '0.0.0'
  const platformMap: PlatformMap = {
    android: 'Android',
    aix: 'Linux',
    darwin: 'macOS',
    freebsd: 'Linux',
    linux: 'Linux',
    openbsd: 'Linux',
    sunos: 'Linux',
    win32: 'Windows',
  }
  if (platform in platformMap) {
    return `${platformMap[platform] || 'Linux'}/${version}`
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

  let platform = null
  try {
    if (isReactNative()) {
      platform = getBrowserOS()
      headerParts.push('platform ReactNative')
    } else if (isNode()) {
      platform = getNodeOS()
      headerParts.push(`platform node.js/${getNodeVersion()}`)
    } else {
      platform = getBrowserOS()
      headerParts.push('platform browser')
    }
  } catch (e) {
    platform = null
  }

  if (platform) {
    headerParts.push(`os ${platform}`)
  }

  return `${headerParts.filter((item) => item !== '').join('; ')};`
}
