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

    savedTranscripts: new Set(),

    selectedClusters: null,
    displayedTranscriptsWithClusters: [],

    order: 'asc',
    sortPath: 'transcript',
  }
}

const createViewReducer = (project: SingleCellProject) => createReducer(blankView(project), builder => {
  builder
    .addCase(viewActions.setSelectedClusters, (state, action) => {
      const { clusters } = action.payload

      state.selectedClusters = clusters
    })
    .addCase(viewActions.updateDisplayedSingleCellTranscripts.fulfilled, (state, action) => {
      const { displayedTranscripts } = action.payload

      state.displayedTranscriptsWithClusters = displayedTranscripts
    })
    .addCase(viewActions.setHoveredTranscript, (state, action) => {
      const { transcript } = action.payload

      state.hoveredTranscript = transcript
    })
})

export default createViewReducer;