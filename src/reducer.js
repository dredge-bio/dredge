"use strict";

const R = require('ramda')

function view(project) {
  return {
    project,
    loading: false,

    // comparedTreatments: null,
    pairwiseData: null,

    pValueThreshold: 1,

    focusedTranscript: null,
    hoveredTranscript: null,
    hoveredTreatment: null,

    savedTranscripts: new Set(),
    brushedTranscripts: new Set(),

    displayedTranscripts: null,
    order: 'asc',
    sortPath: ['transcript', 'label'],
  }
}

function initialState() {
  return {
    initialized: false,
    compatible: null,
    log: {},

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
        const { project='', resourceName='', resourceURL='', status } = action.type

        return R.set(
          R.lensPath(['log', project || '', resourceURL]),
          { status, url: resourceURL, label: resourceName },
          state
        )
      },

      LoadAvailableProjects() {
        return state
      },

      UpdateProject(key, updateFn) {
        return R.over(R.lensPath(['projects', key]), updateFn, state)
      },

      CheckCompatibility() {
        return R.assoc('compatible', true, state)
      },

      ChangeProject() {
        return state
      },

      GetDefaultProject() {
        return state
      },

      ViewProject(projectKey) {
        if (R.path(['currentView', 'project', 'id'], state) === projectKey) {
          return state
        }

        const project = state.projects[projectKey]

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
              brushedTranscripts: new Set(),
            })
          ))
        )(state)
      },

      GetDefaultPairwiseComparison() {
        return state
      },

      UpdateDisplayedTranscripts(sortPath, order) {
        const { displayedTranscripts } = resp

        const updated = { displayedTranscripts }

        if (sortPath) {
          updated.sortPath = sortPath
        }

        if (order) {
          updated.order = order
        }

        return R.over(
          R.lensProp('currentView'),
          R.flip(R.merge)(updated),
          state
        )
      },

      SetHoveredTranscript(transcriptName) {
        return R.assocPath(
          ['currentView', 'hoveredTranscript'],
          transcriptName,
          state
        )
      },


      SetBrushedTranscripts(transcriptNames) {
        return R.assocPath(
          ['currentView', 'brushedTranscripts'],
          new Set(transcriptNames),
          state
        )
      },

      SetSavedTranscripts(transcriptNames) {
        const { currentView: { brushedTranscripts, focusedTranscript, savedTranscripts, hoveredTranscript }} = state
            , nextSavedTranscripts = new Set(transcriptNames)

        let nextFocusedTranscript = focusedTranscript
          , nextHoveredTranscript = hoveredTranscript

        if (!nextSavedTranscripts.has(hoveredTranscript)) {
          nextHoveredTranscript = null
        }

        // If we're viewing saved transcripts, and the focused transcript has been removed
        // from the saved transcripts, then move focus to the next one (if it exists)
        const moveFocusedTranscript = (
          focusedTranscript &&
          !brushedTranscripts.size &&
          savedTranscripts.has(focusedTranscript) &&
          !nextSavedTranscripts.has(focusedTranscript)
        )

        if (moveFocusedTranscript && nextSavedTranscripts.size === 0) {
          nextFocusedTranscript = null
        } else if (moveFocusedTranscript) {
          const savedTranscriptsArr = [...savedTranscripts]
              , idx = savedTranscriptsArr.indexOf(focusedTranscript)
              , inNextSaved = transcript => nextSavedTranscripts.has(transcript)

          // First search for the next one from the list of previous transcripts
          // that's in the next one
          nextFocusedTranscript = R.find(inNextSaved, savedTranscriptsArr.slice(idx))

          // If there's nothing available, then go backwards
          if (!nextFocusedTranscript) {
            nextFocusedTranscript = R.find(inNextSaved, savedTranscriptsArr.slice(0, idx).reverse())
          }

          // If there's nothing found, then focus on the first of the new saved
          // transcripts
          nextFocusedTranscript = [...nextSavedTranscripts][0]
        }

        return R.over(R.lensProp('currentView'), R.flip(R.merge)({
          savedTranscripts: nextSavedTranscripts,
          focusedTranscript: nextFocusedTranscript,
          hoveredTranscript: nextHoveredTranscript,
        }), state)
      },

      SetFocusedTranscript(transcriptName) {
        return R.assocPath(
          ['currentView', 'focusedTranscript'],
          transcriptName,
          state
        )
      },

      SetPValueThreshold(threshold) {
        return R.assocPath(
          ['currentView', 'pValueThreshold'],
          threshold,
          state
        )
      },

      SetHoveredTreatment(treatmentName) {
        return R.assocPath(
          ['currentView', 'hoveredTreatment'],
          treatmentName,
          state
        )
      },

      ImportSavedTranscripts: R.always(state),
      ExportSavedTranscripts: R.always(state),
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
              brushedTranscripts: new Set(),
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
