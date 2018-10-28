const util = {};

util.has = function(obj, key) {
  return key.split('.').every(function(x) {
    if (typeof obj !== 'object' || obj === null || !(x in obj)) {
      return false;
    }
    obj = obj[x];
    return true;
  });
};

util.get = function get(obj, key) {
  return key.split('.').reduce(function(o, x) {
    return typeof o === 'undefined' || o === null ? o : o[x];
  }, obj);
};

util.isObject = function(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
};

module.exports = util;
