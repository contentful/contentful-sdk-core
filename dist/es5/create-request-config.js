'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createRequestConfig;

var _cloneDeep = require('lodash/cloneDeep');

var _cloneDeep2 = _interopRequireDefault(_cloneDeep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates request parameters configuration by parsing an existing query object
 * @private
 * @param {Object} query
 * @return {Object} Config object with `params` property, ready to be used in axios
 */
function createRequestConfig(_ref) {
  var query = _ref.query;

  var config = {};
  delete query.resolveLinks;
  config.params = (0, _cloneDeep2.default)(query);
  return config;
}
module.exports = exports['default'];