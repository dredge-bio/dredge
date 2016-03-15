"use strict";

var db = require('../db')()

module.exports = function () {
  return new Promise((resolve, reject) => {
    db.datasets.get('cellGeneMeasuress', ({ blob }) => {
      var reader = new FileReader();

      reader.onloadend = () => resolve(JSON.parse(reader.result));
      reader.onerror = err => reject(err);

      reader.readAsText(blob);
    });
  });
}
