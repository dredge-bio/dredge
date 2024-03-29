import { createReducer } from '@reduxjs/toolkit'

import { SingleCellViewState } from './types'
import { SingleCellProject } from '@dredge/main'

import * as viewActions from './actions'

function blankView(project: SingleCellProject): SingleCellViewState {
  return {
    project,

    loading: true,
    focusedTranscript: null,
    hoveredTranscript: null,
    hoveredTreatment: null,

    selectedTranscripts: new Set(),
    savedTranscripts: new Set(),
    showOnlySelectedTranscripts: false,

    hoveredCluster: {
      cluster: null,
      source: 'UMAP',
    },

    selectedClusters: new Set(),
    displayedTranscriptsWithClusters: [],

    order: 'asc',
    sortPath: 'transcript',
  }
}

const createViewReducer = (project: SingleCellProject) => createReducer(blankView(project), builder => {
  builder
    .addCase(viewActions.importSavedTranscripts, (state, action) => {
      action.payload.imported.forEach(([ , canonicalName ]) => {
        state.selectedTranscripts.add(canonicalName)
      })
      return state
    })
    .addCase(viewActions.setHoveredCluster, (state, action) => {
      state.hoveredCluster = action.payload
    })
    .addCase(viewActions.setSelectedClusters, (state, action) => {
      const { clusters } = action.payload

      state.selectedClusters = clusters
    })
    .addCase(viewActions.setSelectedTranscripts, (state, action) => {
      const { transcripts } = action.payload

      state.selectedTranscripts = transcripts

      if (transcripts.size === 0) {
        state.showOnlySelectedTranscripts = false;
      }
    })
    .addCase(viewActions.setShowOnlySelectedTranscripts, (state, action) => {
      state.showOnlySelectedTranscripts = action.payload
    })
    .addCase(viewActions.updateDisplayedSingleCellTranscripts.fulfilled, (state, action) => {
      const { displayedTranscripts } = action.payload

      let nextFocusedTranscript = null

      if (state.focusedTranscript) {
        const keepFocusedTranscript = displayedTranscripts.some(
          x => x.transcript.id === state.focusedTranscript)

        if (keepFocusedTranscript) {
          nextFocusedTranscript = state.focusedTranscript
        }
      }

      state.displayedTranscriptsWithClusters = displayedTranscripts
      state.focusedTranscript = nextFocusedTranscript
    })
    .addCase(viewActions.setHoveredTranscript, (state, action) => {
      const { transcript } = action.payload

      state.hoveredTranscript = transcript
    })
    .addCase(viewActions.clearSelectedTranscripts, state => {
      state.selectedTranscripts = new Set()
      state.focusedTranscript = null
      state.showOnlySelectedTranscripts = false;
    })
    .addCase(viewActions.setFocusedTranscript, (state, action) => {
      const { transcript } = action.payload

      state.focusedTranscript = transcript
    })
    .addCase(viewActions.setViewSort, (state, action) => {
      const { path, order } = action.payload

      state.sortPath = path
      state.order = order
    })
})

export default createViewReducer;
