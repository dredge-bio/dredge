import {
  ProjectSource,
  DredgeConfig,
  Project
} from '../types'

import { createReducer } from '@reduxjs/toolkit'

import * as actions from './actions'

type ProjectState = Record<ProjectSource['key'], Project>

function initial(): ProjectState {
  return {
    global: {
      loaded: false,
    },
    local: {
      loaded: false,
      config: defaultLocalConfig(),
    },
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

const reducer = createReducer(initial(), builder => {
  builder.addCase(actions.loadProjectConfig.rejected, (state, action) => {
    const project = action.meta.arg.source

    state[project.key] = {
      loaded: true,
      failed: true,
    }
  })

  builder.addCase(actions.loadProjectConfig.fulfilled, (state, action) => {
    const { config } = action.payload
        , project = action.meta.arg.source

    state[project.key] = {
      loaded: false,
      config,
    }
  })

  builder.addCase(actions.loadProject.fulfilled, (state, action) => {
    const project = action.meta.arg.source
        , { data, config, watchedTranscripts } = action.payload

    state[project.key] = {
      loaded: true,
      failed: false,
      data,
      config,
      watchedTranscripts,
      pairwiseComparisonCache: {},
    }
  })
})

export default reducer
