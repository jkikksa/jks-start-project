'use strict';

var isEscPressed = require('./utils/is-esc-pressed');

document.addEventListener('keydown', function (evt) {
  if (isEscPressed(evt)) {
    console.log('Нажата клавиша ESCAPE');
  }
});
