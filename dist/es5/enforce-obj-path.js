'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = enforceObjPath;
function enforceObjPath(obj, path) {
  if (!(path in obj)) {
    var err = new Error();
    err.name = 'PropertyMissing';
    err.message = 'Required property ' + path + ' missing from:\n\n' + JSON.stringify(obj) + '\n\n';
    throw err;
  }
  return true;
}
module.exports = exports['default'];