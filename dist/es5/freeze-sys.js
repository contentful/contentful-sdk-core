'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = freezeSys;

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function freezeObjectDeep(obj) {
  Object.keys(obj).forEach(function (key) {
    var value = obj[key];
    if ((0, _isPlainObject2.default)(value)) {
      freezeObjectDeep(value);
    }
  });
  return Object.freeze(obj);
}

function freezeSys(obj) {
  freezeObjectDeep(obj.sys || {});
  return obj;
}
module.exports = exports['default'];