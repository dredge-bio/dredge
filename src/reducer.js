"use strict";

const R = require('ramda')

function blankView(source, extra) {
  return Object.assign({
    source,

    loading: true,

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
  }, extra)
}

function defaultLocalConfig() {
  return {
    baseURL: '',
    config: {
      label: '',
      url: '',
      readme: '',
      abundanceLimits: [
        [0, 100],
        [-100, 100],
      ],
      treatments: './treatments.json',
      pairwiseName: './pairwise_files/%A_%B.txt',
      transcriptAliases: './aliases.txt',
      abundanceMeasures: './abundanceMeasures.txt',
      diagram: './diagram.svg',
    },
  }
}

function initialState() {
  return {
    isGloballyConfigured: 'DREDGE_PROJECT_CONFIG_URL' in window,

    compatible: null,

    log: {},

    projects: {
      global: {
        loaded: false,
      },
      local: Object.assign({ loaded: false }, defaultLocalConfig()),
    },
    view: null,
  }
}

module.exports = function reducer(state=initialState(), action) {
  if (!action.readyState) return state

  return action.readyState.case({
    Success: resp => action.type.case({
      Log() {
        const { project, resourceName='', resourceURL='', status } = action.type

        return R.set(
          R.lensPath(['log', project || '', resourceURL || resourceName]),
          { status, url: resourceURL, label: resourceName },
          state
        )
      },

      ResetLog() {
        const { project } = action.type

        return R.set(
          R.lensPath(['log', project || '']),
          {},
          state
        )
      },

      CheckCompatibility() {
        return R.assoc('compatible', true, state)
      },

      LoadProjectConfig(source) {
        const { config } = resp

        return R.over(
          R.lensPath(['projects', source.key]),
          R.flip(R.merge)({
            source,
            config,
          }),
          state
        )
      },

      UpdateLocalConfig() {
        const { update } = resp

        return R.over(
          R.lensPath(['projects', 'local']),
          update,
          state
        )
      },

      LoadProject(source) {
        const { savedTranscripts } = resp

        return R.pipe(
          R.set(R.lensPath(['view', 'savedTranscripts']), savedTranscripts),
          R.set(R.lensPath(['projects', source.key, 'loaded']), true)
        )(state)
      },

      UpdateProject(source, updateFn) {
        return R.over(
          R.lensPath(['projects', source.key]),
          updateFn,
          state
        )
      },

      SetPairwiseComparison(treatmentA, treatmentB) {
        const { pairwiseData } = resp

        return R.pipe(
          R.over(
            R.lensPath(['pairwiseComparisonCache', [treatmentA, treatmentB]]),
            R.set,
            pairwiseData),
          R.over(
            R.lensProp('view'),
            R.flip(R.merge)({
              loading: false,
              pairwiseData,
              comparedTreatments: [treatmentA, treatmentB],
              brushedTranscripts: new Set(),
            }))
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
          R.lensProp('view'),
          R.flip(R.merge)(updated),
          state
        )
      },

      SetHoveredTranscript(transcriptName) {
        return R.assocPath(
          ['view', 'hoveredTranscript'],
          transcriptName,
          state
        )
      },


      SetBrushedTranscripts(transcriptNames) {
        return R.assocPath(
          ['view', 'brushedTranscripts'],
          new Set(transcriptNames),
          state
        )
      },

      SetSavedTranscripts(transcriptNames) {
        const { view: { brushedTranscripts, focusedTranscript, savedTranscripts, hoveredTranscript }} = state
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

        return R.over(R.lensProp('view'), R.flip(R.merge)({
          savedTranscripts: nextSavedTranscripts,
          focusedTranscript: nextFocusedTranscript,
          hoveredTranscript: nextHoveredTranscript,
        }), state)
      },

      SetFocusedTranscript(transcriptName) {
        return R.assocPath(
          ['view', 'focusedTranscript'],
          transcriptName,
          state
        )
      },

      SetPValueThreshold(threshold) {
        return R.assocPath(
          ['view', 'pValueThreshold'],
          threshold,
          state
        )
      },

      SetHoveredTreatment(treatmentName) {
        return R.assocPath(
          ['view', 'hoveredTreatment'],
          treatmentName,
          state
        )
      },

      ImportSavedTranscripts: R.always(state),
      ExportSavedTranscripts: R.always(state),
    }),

    Pending: () => action.type.case({
      LoadProject(source) {
        return Object.assign({}, state, {
          view: blankView(source),
        })
      },

      SetPairwiseComparison() {
        return R.assocPath(['view', 'loading'], true, state)
      },

      _: R.always(state),
    }),

    Failure: err => action.type.case({
      LoadProject(source) {
        return R.over(
          R.lensPath(['projects', source.key]),
          R.flip(R.merge)({ loaded: true, failed: true }),
          state
        )
      },

      SetPairwiseComparison(treatmentA, treatmentB) {
        return R.over(
          R.lensProp('view'),
          R.flip(R.merge)({
            loading: false,
            pairwiseData: null,
            comparedTreatments: [treatmentA, treatmentB],
            brushedTranscripts: new Set(),
          }),
          state
        )
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
