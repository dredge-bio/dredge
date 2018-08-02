"use strict";

const R = require('ramda')

function initialState() {
  return {
    compatibile: null,

    datasets: {
      'sophie': {
        // Pairwise comparison with keys as `A_B`
        pairwiseData: {},
        currentPairwiseComparison: null,
        savedGenes: new Set(),
        brushedGenes: new Set(),
      },
    },


    loading: false,
  }
}

module.exports = function reducer(state=initialState(), action) {
  return action.readyState.case({
    Success: resp => action.type.case({
      CheckCompatibility() {
        return R.set('compatible', true, state)
      },

      LoadDataset() {
        return state
      },

      SetPairwiseComparison(cellA, cellB) {
        const key = `${cellA}${cellB}`

        return R.update(
          R.lensPath(['datasets', 'sophie']),
          R.pipe(
            R.assocPath(['pairwiseData', key], resp.pairwiseData),
            R.set('currentPairwiseComparison', [cellA, cellB]),
            R.set('brushedGenes', new Set()),
          ),
          state
        )
      },

      SetSavedGeneNames(geneNames) {
        return R.assocPath(
          ['datasets', 'sophie', 'savedGenes'],
          new Set(geneNames),
          state
        )
      },

      SetBrushedGeneNames(geneNames) {
        return R.assocPath(
          ['datasets', 'sophie', 'brushedGenes'],
          new Set(geneNames),
          state
        )
      },
    }),
    Failure: err => action.type.case({
      CheckCompatibility() {
        return R.set('compatibile', false, state)
      },
      _: () => {
        // eslint-disable-next-line no-console
        console.error(err)
        return state
      },
    }),
    Pending: () => state,
  })
}
