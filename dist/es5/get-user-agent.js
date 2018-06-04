'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getUserAgentHeader;

var _utils = require('./utils');

function isReactNative() {
  return typeof window !== 'undefined' && 'navigator' in window && 'product' in window.navigator && window.navigator.product === 'ReactNative';
}

function getBrowserOS() {
  if (!window) {
    return null;
  }
  var userAgent = window.navigator.userAgent;
  var platform = window.navigator.platform;
  var macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  var windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  var iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  var os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'macOS';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'iOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (/Linux/.test(platform)) {
    os = 'Linux';
  }

  return os;
}

function getNodeOS() {
  var _require = require('os'),
      platform = _require.platform,
      release = _require.release;

  var os = platform() || 'linux';
  var version = release() || '0.0.0';
  var osMap = {
    android: 'Android',
    aix: 'Linux',
    darwin: 'macOS',
    freebsd: 'Linux',
    linux: 'Linux',
    openbsd: 'Linux',
    sunos: 'Linux',
    win32: 'Windows'
  };
  if (os in osMap) {
    return (osMap[os] || 'Linux') + '/' + version;
  }
  return null;
}

function getUserAgentHeader(sdk, application, integration) {
  var headerParts = [];

  if (application) {
    headerParts.push('app ' + application);
  }

  if (integration) {
    headerParts.push('integration ' + integration);
  }

  headerParts.push('sdk ' + sdk);

  var os = null;
  if (isReactNative()) {
    os = getBrowserOS();
    headerParts.push('platform ReactNative');
  } else if ((0, _utils.isNode)()) {
    os = getNodeOS();
    headerParts.push('platform node.js/' + (0, _utils.getNodeVersion)());
  } else {
    os = getBrowserOS();
    headerParts.push('platform browser');
  }

  if (os) {
    headerParts.push('os ' + os);
  }

  return headerParts.filter(function (item) {
    return item !== '';
  }).join('; ') + ';';
}
module.exports = exports['default'];