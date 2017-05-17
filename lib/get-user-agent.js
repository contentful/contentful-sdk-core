import platform from 'platform'

export default function getUserAgentHeader (sdk, application, integration) {
  const headerParts = []

  headerParts.push(application ? `app ${application}` : '')
  headerParts.push(integration ? `integration ${integration}` : '')
  headerParts.push(`sdk ${sdk}`)
  headerParts.push(`platform ${platform.name}/${platform.version}`)
  headerParts.push(`os ${platform.os.family}/${platform.os.version || '0.0.0'}`)
  return headerParts.filter((item) => item !== '').join('; ')
}
