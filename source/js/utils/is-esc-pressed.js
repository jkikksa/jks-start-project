'use strict';
/**
 * @const {Number}
 */
var ESC_KEY_CODE = 27;

module.exports = function (evt) {
  return evt.keyCode === ESC_KEY_CODE;
};
