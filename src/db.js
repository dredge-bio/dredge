"use strict";

var Dexie = require('dexie')
  , _db

function seedData(db) {
  var promises = [
    fetch('data/20160315_geneExpressionAvg.csv'),
    fetch('data/20160315_geneExpressionMed.csv')
  ]

  return new Dexie.Promise((resolve, reject) => {
      Promise.all(promises)
        .then(data => Promise.all(data.map(resp => resp.text())))
        .then(data => data.map(set => set.trim().split('\n')))
        .then(resolve, reject)
    })
    .then(([avgData, medData]) => {
      var cells = avgData.slice(0, 1)[0].slice(1).split(',')
        , data = {}

      avgData.splice(0, 1);
      medData.splice(0, 1);

      cells.forEach(cell => { data[cell] = {} });

      for (var i = 0; i < avgData.length; i++) {
        let avgs = avgData[i].split(',')
          , meds = medData[i].split(',')
          , gene

        gene = avgs.slice(0, 1)[0];
        avgs.splice(0, 1);
        meds.splice(0, 1);

        avgs = avgs.map(parseFloat);
        meds = meds.map(parseFloat);

        for (var j = 0; j < avgs.length; j++) {
          let cell = cells[j]
            , avg = avgs[j]
            , med = meds[j]

          data[cell][gene] = { avg, med };
        }
      }

      return db.datasets.put({
        name: 'cellGeneMeasuress',
        blob: new Blob([JSON.stringify(data)], { type: 'application/json' })
      });
    });
}

module.exports = function () {
  if (!_db) {
    _db = new Dexie('data-cache')

    _db.version(1).stores({ datasets: 'name' })

    _db.on('ready', () => _db.datasets.get('cellGeneMeasuress', d => d || seedData(_db)))

    _db.open();
  }

  return _db;
}
