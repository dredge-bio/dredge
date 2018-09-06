"use strict";

const R = require('ramda')

function view(project) {
  return {
    project,
    loading: false,

    comparedTreatments: null,
    pairwiseData: null,

    savedGenes: new Set(),
    brushedGenes: new Set(),
  }
}

function initialState() {
  return {
    initialized: false,
    compatible: null,
    log: [],

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

      ChangeProject() {
        return state
      },

      ViewProject(projectBaseURL) {
        const project = state.projects[projectBaseURL]

        return R.assoc('currentView', view(project), state)
      },

      SetPairwiseComparison(treatmentA, treatmentB) {
        const { pairwiseData } = resp

        return R.pipe(
          R.over(R.lensProp('currentView'), R.pipe(
            R.assoc('loading', false),
            R.assocPath(
              ['project', 'pairwiseComparisonCache', [treatmentA, treatmentB]],
              pairwiseData
            ),
            R.flip(R.merge)({
              pairwiseData,
              comparedTreatments: [treatmentA, treatmentB],
              brushedGenes: new Set(),
            })
          ))
        )(state)
      },

      SetBrushedGenes(genes) {
        return R.assocPath(
          ['currentView', 'brushedGenes'],
          new Set(genes),
          state
        )
      },

      SetSavedGenes(genes) {
        return R.assocPath(
          ['currentView', 'savedGenes'],
          new Set(genes),
          state
        )
      },
    }),

    Pending: () => action.type.case({
      SetPairwiseComparison() {
        return R.assocPath(['currentView', 'loading'], true, state)
      },

      _: R.always(state),
    }),

    Failure: err => action.type.case({
      SetPairwiseComparison(treatmentA, treatmentB) {
        return R.pipe(
          R.over(R.lensProp('currentView'), R.pipe(
            R.assoc('loading', false),
            R.flip(R.merge)({
              pairwiseData: null,
              comparedTreatments: [treatmentA, treatmentB],
              brushedGenes: new Set(),
            })
          ))
        )(state)
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
