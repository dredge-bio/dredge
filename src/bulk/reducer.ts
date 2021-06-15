import * as R from 'ramda'
import { createReducer } from '@reduxjs/toolkit'

import { BulkViewState } from './types'
import { BulkProject } from '@dredge/main'


import * as viewActions from './actions'

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

const createViewReducer = (project: BulkProject) => createReducer(blankBulkView(project), builder => {
  builder
    .addCase(viewActions.setPairwiseComparison.pending, (state, action) => {
      const { treatmentAKey, treatmentBKey } = action.meta.arg

      state = {
        ...state,
        loading: true,
        pairwiseData: null,
        displayedTranscripts: null,
        comparedTreatments: [treatmentAKey, treatmentBKey],
      }
    })
    .addCase(viewActions.setPairwiseComparison.fulfilled, (state, action) => {
      /*
       FIXME: Put in project reducer
          , project = state.projects[projectKey]

      if (!project.loaded) return

      project.pairwiseComparisonCache[pairwiseKey] = pairwiseData
      */

      const { pairwiseData } = action.payload
          , { treatmentAKey, treatmentBKey } = action.meta.arg

      state = {
        ...state,
        loading: false,
        pairwiseData,
        comparedTreatments: [treatmentAKey, treatmentBKey],
      }
    })
    .addCase(viewActions.updateSortForTreatments.fulfilled, (state, action) => {
      const { sortPath: newSortPath, order: newOrder } = action.meta.arg
          , { sortedTranscripts } = action.payload
          , { sortPath, order } = state

      state = {
        ...state,
        loading: false,
        sortPath: newSortPath || sortPath,
        order: newOrder || order,
        sortedTranscripts,
      }
    })
    .addCase(viewActions.updateDisplayedTranscripts.fulfilled, (state, action) => {
      const { source, displayedTranscripts } = action.payload

      state.displayedTranscripts = {
        source,
        transcripts: displayedTranscripts,
      }

      state.hoveredTranscript = null
    })
    .addCase(viewActions.setSavedTranscripts.fulfilled, (state, action) => {
      const { transcriptNames } = action.meta.arg
          , { brushedArea, focusedTranscript, savedTranscripts, hoveredTranscript } = state
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
              , inNextSaved = (transcript: string) => nextSavedTranscripts.has(transcript)

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

        state.savedTranscripts = nextSavedTranscripts;
        state.focusedTranscript = nextFocusedTranscript;
        state.hoveredTranscript = nextHoveredTranscript;
    })
    .addCase(viewActions.setHoveredBinTranscripts, (state, action) => {
      const { transcripts } = action.payload

      state.hoveredBinTranscripts = transcripts
    })
    .addCase(viewActions.setSelectedBinTranscripts, (state, action) => {
      const { transcripts } = action.payload

      state.selectedBinTranscripts = transcripts
    })
    .addCase(viewActions.setBrushedArea, (state, action) => {
      const { coords } = action.payload

      state.brushedArea = coords
    })
    .addCase(viewActions.setHoveredTranscript, (state, action) => {
      const { transcript } = action.payload

      state.hoveredTranscript = transcript
    })
    .addCase(viewActions.setHoveredTreatment, (state, action) => {
      const { treatment } = action.payload

      state.hoveredTreatment = treatment
    })
    .addCase(viewActions.setFocusedTranscript, (state, action) => {
      const { transcript } = action.payload

      state.focusedTranscript = transcript
    })
    .addCase(viewActions.setPValueThreshold, (state, action) => {
      const { threshold } = action.payload

      state.pValueThreshold = threshold
    })
    /*
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
    */
})

export default createViewReducer;
