"use strict";

const R = require('ramda')

function blankView(source, extra) {
  return Object.assign({
    source,

    loading: true,

    // comparedTreatments: null,
    pairwiseData: null,
    sortedTranscripts: null,

    pValueThreshold: 1,

    focusedTranscript: null,
    hoveredTranscript: null,
    hoveredTreatment: null,

    savedTranscripts: new Set(),
    brushedArea: null,
    hoveredBinTranscripts: null,
    selectedBinTranscripts: null,

    displayedTranscripts: null,
    order: 'asc',
    sortPath: ['name'],
  }, extra)
}

function defaultLocalConfig() {
  return {
    config: {
      label: '',
      readme: './about.md',
      transcriptHyperlink: [
        {
          label: 'NCBI',
          url: 'https://www.ncbi.nlm.nih.gov/gene/?term=%name',
        },
      ],
      abundanceLimits: [
        [0, 100],
        [-100, 100],
      ],
      heatmapMinimumMaximum: 0,
      treatments: './treatments.json',
      pairwiseName: './pairwise_files/%A_vs_%B.tsv',
      transcriptAliases: './transcript_aliases.tsv',
      abundanceMeasures: './expression_matrix.tsv',
      diagram: './icons.svg',
      grid: './grid.csv',
    },
  }
}

function initialState() {
  return {
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

      SetTitle(title) {
        let newTitle = ''

        if (title) {
          newTitle += `${title}`
        }

        if (newTitle) {
          newTitle += ' - '
        }

        newTitle += 'DrEdGE'

        document.title = newTitle

        return state
      },

      ResetLog() {
        const { project } = action.type

        return R.set(
          R.lensPath(['log', project || '']),
          {},
          state
        )
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

      UpdateLocalConfig(update) {
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
            , projectKey = state.view.source.key

        return R.pipe(
          R.set(
            R.lensPath(['projects', projectKey, 'pairwiseComparisonCache', [treatmentA, treatmentB]]),
            pairwiseData),
          R.over(
            R.lensProp('view'),
            R.flip(R.merge)({
              loading: false,
              pairwiseData,
              comparedTreatments: [treatmentA, treatmentB],
            }))
        )(state)
      },

      UpdateSortForTreatments(newSortPath, newOrder) {
        const { sortPath, order } = state.view
            , { sortedTranscripts } = resp

        return R.pipe(
          R.set(
            R.lensPath(['view', 'sortPath']),
            newSortPath || sortPath),
          R.set(
            R.lensPath(['view', 'order']),
            newOrder || order),
          R.set(
            R.lensPath(['view', 'sortedTranscripts']),
            sortedTranscripts)
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

      SetHoveredBinTranscripts(transcripts) {
        return R.assocPath(
          ['view', 'hoveredBinTranscripts'],
          transcripts,
          state
        )
      },

      SetSelectedBinTranscripts(transcripts) {
        return R.assocPath(
          ['view', 'selectedBinTranscripts'],
          transcripts,
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


      SetBrushedArea(coords) {
        return R.assocPath(
          ['view', 'brushedArea'],
          coords,
          state
        )
      },

      SetSavedTranscripts(transcriptNames) {
        const { view: { brushedArea, focusedTranscript, savedTranscripts, hoveredTranscript }} = state
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
          brushedArea != null &&
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
          R.flip(R.merge)({
            loaded: true,
            failed: true,
            failedReason: err.msg || 'Failed loading project',
          }),
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
            brushedArea: null,
          }),
          state
        )
      },

      _: () => {
        // eslint-disable-next-line no-console
        console.error(err)
        return state
      },
    }),
  })
}
