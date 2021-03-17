"use strict";

import * as R from 'ramda';

import {
  ProjectSource,
  ViewState,
  DredgeConfig,
  DredgeState,
  TranscriptName
} from './ts_types'

import { createReducer } from '@reduxjs/toolkit'

import * as actions from './actions'

function blankView(source: ProjectSource): ViewState {
  return {
    source,

    loading: true,

    comparedTreatments: null,
    pairwiseData: null,
    sortedTranscripts: [],

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
    sortPath: 'name',
  }
}

function defaultLocalConfig(): DredgeConfig {
  return {
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
    diagram: './diagram.svg',
    grid: './grid.csv',
  }
}

function initialState(): DredgeState {
  return {
    log: {},

    projects: {
      global: {
        loaded: false,
      },
      local: {
        loaded: false,
        config: defaultLocalConfig(),
      },
    },
    view: null,
  }
}

const reducer = createReducer(initialState(), builder => {
  builder
    .addCase(actions.setPairwiseComparison.fulfilled, (state, action) => {
      const { pairwiseData } = action.payload
          , { treatmentAKey, treatmentBKey } = action.meta.arg
          , pairwiseKey = [treatmentAKey, treatmentBKey].toString()
          , projectKey = state.view!.source.key

      state.projects[projectKey]!.pairwiseComparisonCache[pairwiseKey] = pairwiseData
      state.view = {
        ...state.view!,
        loading: false,
        pairwiseData,
        comparedTreatments: [treatmentAKey, treatmentBKey]
      }
    })
    .addCase(actions.updateSortForTreatments.fulfilled, (state, action) => {
      if (!state.view) return

      const { sortPath: newSortPath, order: newOrder } = action.meta.arg
          , { sortedTranscripts } = action.payload
          , { sortPath, order } = state.view

      state.view = {
        ...state.view,
        loading: false,
        sortPath: newSortPath || sortPath,
        order: newOrder || order,
        sortedTranscripts,
      }
    })
    .addCase(actions.updateDisplayedTranscripts.fulfilled, (state, action) => {
      if (!state.view) return

      const { sortPath, order } = action.meta.arg
          , { displayedTranscripts } = action.payload

      state.view.displayedTranscripts = displayedTranscripts

      if (sortPath) {
        state.view.sortPath = sortPath
      }

      if (order) {
        state.view.order = order
      }
    })
    .addCase(actions.setSavedTranscripts.fulfilled, (state, action) => {
      if (!state.view) return

      const { transcriptNames } = action.meta.arg
          , { view: { brushedArea, focusedTranscript, savedTranscripts, hoveredTranscript }} = state
            , nextSavedTranscripts = new Set(transcriptNames)

        let nextFocusedTranscript = focusedTranscript
          , nextHoveredTranscript = hoveredTranscript

        if (hoveredTranscript && !nextSavedTranscripts.has(hoveredTranscript)) {
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
          const savedTranscriptsArr = Array.from(savedTranscripts)
              , idx = savedTranscriptsArr.indexOf(focusedTranscript!)
              , inNextSaved = (transcript: TranscriptName) => nextSavedTranscripts.has(transcript)

          // First search for the next one from the list of previous transcripts
          // that's in the next one
          nextFocusedTranscript = R.find(inNextSaved, savedTranscriptsArr.slice(idx)) || null

          // If there's nothing available, then go backwards
          if (!nextFocusedTranscript) {
            nextFocusedTranscript = R.find(inNextSaved, savedTranscriptsArr.slice(0, idx).reverse()) || null
          }

          // If there's nothing found, then focus on the first of the new saved
          // transcripts
          nextFocusedTranscript = Array.from(nextSavedTranscripts)[0]
        }

        state.view.savedTranscripts = nextSavedTranscripts;
        state.view.focusedTranscript = nextFocusedTranscript;
        state.view.hoveredTranscript = nextHoveredTranscript;
    })
    .addCase(actions.setHoveredBinTranscripts, (state, action) => {
      if (!state.view) return

      const { transcripts } = action.payload

      state.view.hoveredBinTranscripts = transcripts
    })
    .addCase(actions.setSelectedBinTranscripts, (state, action) => {
      if (!state.view) return

      const { transcripts } = action.payload

      state.view.selectedBinTranscripts = transcripts
    })
    .addCase(actions.setBrushedArea, (state, action) => {
      if (!state.view) return

      const { coords } = action.payload

      state.view.brushedArea = coords
    })
    .addCase(actions.setHoveredTranscript, (state, action) => {
      if (!state.view) return

      const { transcript } = action.payload

      state.view.hoveredTranscript = transcript
    })
    .addCase(actions.setHoveredTreatment, (state, action) => {
      if (!state.view) return

      const { treatment } = action.payload

      state.view.hoveredTreatment = treatment
    })
    .addCase(actions.setFocusedTranscript, (state, action) => {
      if (!state.view) return

      const { transcript } = action.payload

      state.view.focusedTranscript = transcript
    })
    .addCase(actions.setPValueThreshold, (state, action) => {
      if (!state.view) return

      const { threshold } = action.payload

      state.view.pValueThreshold = threshold
    })
})

export default reducer;

/*
export default function reducer(state=initialState(), action: any) {
  if (actions.setPairwiseComparison.fulfilled.match(action)) {
    const { pairwiseData } = action.payload
        , { treatmentAKey, treatmentBKey } = action.meta.arg
        , pairwiseKey = [treatmentAKey, treatmentBKey].toString()
        , projectKey = state.view!.source.key

    const val = R.view(
      R.lensPath(['projects', projectKey, 'pairwiseComparisonCache']),
      state)

    const val2 = state.projects[projectKey]!.pairwiseComparisonCache

    const newState: DredgeState = R.pipe(
        R.set(
          R.lensPath(['projects', projectKey, 'pairwiseComparisonCache', [treatmentAKey, treatmentBKey].join(',')]),
          2),
    )(state)
  }

  if (!action.readyState) return state

  return action.readyState.case({
    Success: resp => action.type.case({
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
*/
