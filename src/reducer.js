"use strict";

const R = require('ramda')

function view(projectBaseURL) {
  return {
    projectBaseURL,

    // Pairwise comparison with keys as `A_B`
    pairwiseData: {},
    currentPairwiseComparison: null,
    savedGenes: new Set(),
    brushedGenes: new Set(),
  }
}

function initialState() {
  return {
    initialized: false,
    compatible: null,
    datasets: {},
    log: [],
    loading: false,
    projects: null,
    currentView: null,
  }
}

module.exports = function reducer(state=initialState(), action) {
  if (!action.readyState) return state

  return action.readyState.case({
    Success: resp => action.type.case({
      Initialize() {
        return R.assoc('initialized', true, state)
      },

      Log() {
        return R.over(R.lensProp('log'), val => val.concat(action.type.message), state)
      },

      LoadAvailableProjects() {
        return R.assoc('projects', resp.projects, state)
      },

      CheckCompatibility() {
        return R.assoc('compatible', true, state)
      },

      ViewProject(projectBaseURL) {
        return R.assoc('currentView', view(projectBaseURL), state)
      },

      SetPairwiseComparison(project, cellA, cellB) {
        const key = `${cellA}${cellB}`

        return R.pipe(
          R.assoc('loading', false),
          R.over(
            R.lensPath(['projects', project]),
            R.pipe(
              R.assocPath(['pairwiseData', key], resp.pairwiseData),
              R.set('currentPairwiseComparison', [cellA, cellB]),
              R.set('brushedGenes', new Set()),
            )
          )
        )(state)
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

    Pending: () => action.type.case({
      SetPairwiseComparison() {
        return R.assoc('loading', true, state)
      },

      _: R.always(state),
    }),

    Failure: err => action.type.case({
      SetPairwiseComparison() {
        return R.assoc('loading', false, state)
      },

      CheckCompatibility() {
        return R.set('compatible', false, state)
      },
      _: () => {
        // eslint-disable-next-line no-console
        console.error(err)
        return state
      },
    }),
  })
}
