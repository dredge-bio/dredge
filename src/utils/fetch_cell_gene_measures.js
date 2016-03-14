"use strict";

var db = require('../db')()

module.exports = function () {
  return new Promise((resolve, reject) => {
    db.datasets.get('cellGeneMeasures', ({ blob }) => {
      var reader = new FileReader();

      reader.onloadend = () => resolve(JSON.parse(reader.result));
      reader.onerror = err => reject(err);

      reader.readAsText(blob);
    });
  });
}
