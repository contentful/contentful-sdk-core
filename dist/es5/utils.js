'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNode = isNode;
exports.getNodeVersion = getNodeVersion;
function isNode() {
  /**
   * Polyfills of 'process' might set process.browser === true
   *
   * See:
   * https://github.com/webpack/node-libs-browser/blob/master/mock/process.js#L8
   * https://github.com/defunctzombie/node-process/blob/master/browser.js#L156
  **/
  return typeof process !== 'undefined' && !process.browser;
}

function getNodeVersion() {
  return process.versions.node ? 'v' + process.versions.node : process.version;
}