import * as R from 'ramda';
import { Draft } from 'immer'

import {
  BulkViewState,
  SingleCellViewState,
  TranscriptName,
  BulkProject,
  SingleCellProject,
  LoadedProject
} from '../types'

import { createReducer } from '@reduxjs/toolkit'

import * as viewActions from './actions'
import { actions as projectActions } from '../projects'

function blankBulkView(project: BulkProject): BulkViewState {
  return {
    project,

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
    sortPath: 'label',
  }
}

function blankSingleCellView(project: SingleCellProject): SingleCellViewState {
  return {
    project,

    loading: true,
    focusedTranscript: null,
    hoveredTranscript: null,
    hoveredTreatment: null,

    savedTranscripts: new Set(),

    selectedClusters: null,
    displayedTranscriptsWithClusters: [],

    order: 'asc',
    sortPath: 'transcript',
  }
}

function blankView(project: LoadedProject) {
  if (project.type === 'Bulk') {
    return blankBulkView(project)
  } else if (project.type === 'SingleCell') {
    return blankSingleCellView(project)
  } else {
    throw new Error()
  }
}

type MultiViewState = null | {
  default: BulkViewState | SingleCellViewState
}

function isSingleCellView(view: Draft<MultiViewState>): view is Draft<{ default: SingleCellViewState }> {
  if (view?.default.project.type !== 'SingleCell') {
    throw new Error()
  }

  return true
}

function isBulkView(view: Draft<MultiViewState>): view is Draft<{ default: BulkViewState }> {
  if (view?.default.project.type !== 'Bulk') {
    throw new Error()
  }

  return true
}


const reducer = createReducer(null as MultiViewState, builder => {
  builder
    .addCase(projectActions.loadProject.fulfilled, (state, action) => {
      return {
        default: blankView(action.payload),
      }
    })
    .addCase(viewActions.setPairwiseComparison.pending, (state, action) => {
      if (!isBulkView(state)) return state

      const { treatmentAKey, treatmentBKey } = action.meta.arg

      state.default = {
        ...state.default,
        loading: true,
        pairwiseData: null,
        displayedTranscripts: null,
        comparedTreatments: [treatmentAKey, treatmentBKey],
      }
    })
    .addCase(viewActions.setPairwiseComparison.fulfilled, (state, action) => {
      if (!isBulkView(state)) return state

      /*
       FIXME: Put in project reducer
          , project = state.projects[projectKey]

      if (!project.loaded) return

      project.pairwiseComparisonCache[pairwiseKey] = pairwiseData
      */

      const { pairwiseData } = action.payload
          , { treatmentAKey, treatmentBKey } = action.meta.arg

      state.default = {
        ...state.default,
        loading: false,
        pairwiseData,
        comparedTreatments: [treatmentAKey, treatmentBKey],
      }
    })
    .addCase(viewActions.updateSortForTreatments.fulfilled, (state, action) => {
      if (!isBulkView(state)) return state

      const { sortPath: newSortPath, order: newOrder } = action.meta.arg
          , { sortedTranscripts } = action.payload
          , { sortPath, order } = state.default

      state.default = {
        ...state.default,
        loading: false,
        sortPath: newSortPath || sortPath,
        order: newOrder || order,
        sortedTranscripts,
      }
    })
    .addCase(viewActions.updateDisplayedTranscripts.fulfilled, (state, action) => {
      if (!isBulkView(state)) return state

      const { source, displayedTranscripts } = action.payload

      state.default.displayedTranscripts = {
        source,
        transcripts: displayedTranscripts,
      }

      state.default.hoveredTranscript = null
    })
    .addCase(viewActions.setSavedTranscripts.fulfilled, (state, action) => {
      if (!isBulkView(state)) return state

      const { transcriptNames } = action.meta.arg
          , { default: { brushedArea, focusedTranscript, savedTranscripts, hoveredTranscript }} = state
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
          nextFocusedTranscript = Array.from(nextSavedTranscripts)[0] || null
        }

        state.default.savedTranscripts = nextSavedTranscripts;
        state.default.focusedTranscript = nextFocusedTranscript;
        state.default.hoveredTranscript = nextHoveredTranscript;
    })
    .addCase(viewActions.setHoveredBinTranscripts, (state, action) => {
      if (!isBulkView(state)) return state

      const { transcripts } = action.payload

      state.default.hoveredBinTranscripts = transcripts
    })
    .addCase(viewActions.setSelectedBinTranscripts, (state, action) => {
      if (!isBulkView(state)) return state

      const { transcripts } = action.payload

      state.default.selectedBinTranscripts = transcripts
    })
    .addCase(viewActions.setBrushedArea, (state, action) => {
      if (!isBulkView(state)) return state

      const { coords } = action.payload

      state.default.brushedArea = coords
    })
    .addCase(viewActions.setHoveredTranscript, (state, action) => {
      if (!state) return

      const { transcript } = action.payload

      state.default.hoveredTranscript = transcript
    })
    .addCase(viewActions.setHoveredTreatment, (state, action) => {
      if (!state) return

      const { treatment } = action.payload

      state.default.hoveredTreatment = treatment
    })
    .addCase(viewActions.setFocusedTranscript, (state, action) => {
      if (!state) return

      const { transcript } = action.payload

      state.default.focusedTranscript = transcript
    })
    .addCase(viewActions.setPValueThreshold, (state, action) => {
      if (!isBulkView(state)) return state

      const { threshold } = action.payload

      state.default.pValueThreshold = threshold
    })
    .addCase(viewActions.setSelectedClusters, (state, action) => {
      if (!isSingleCellView(state)) return state

      const { clusters } = action.payload

      state.default.selectedClusters = clusters
    })
    .addCase(viewActions.updateDisplayedSingleCellTranscripts.fulfilled, (state, action) => {
      if (!isSingleCellView(state)) return state

      const { displayedTranscripts } = action.payload

      state.default.displayedTranscriptsWithClusters = displayedTranscripts
    })
})

export default reducer;

/*
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
