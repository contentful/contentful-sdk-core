import isPlainObject from 'lodash/isPlainObject';

function freezeObjectDeep(obj) {
  Object.keys(obj).forEach(function (key) {
    var value = obj[key];
    if (isPlainObject(value)) {
      freezeObjectDeep(value);
    }
  });
  return Object.freeze(obj);
}

export default function freezeSys(obj) {
  freezeObjectDeep(obj.sys || {});
  return obj;
}