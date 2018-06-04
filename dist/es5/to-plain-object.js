'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toPlainObject;

var _cloneDeep = require('lodash/cloneDeep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mixes in a method to return just a plain object with no additional methods
 * @private
 * @param {Object} data - Any plain JSON response returned from the API
 * @return {Object} Enhanced object with toPlainObject method
 */
function toPlainObject(data) {
  return Object.defineProperty(data, 'toPlainObject', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function value() {
      return (0, _cloneDeep2.default)(this);
    }
  });
}
module.exports = exports['default'];