import {
  ProjectSource,
  Project
} from '@dredge/main'

import * as bulk from '@dredge/bulk'

import { createReducer } from '@reduxjs/toolkit'

import * as actions from './actions'

type ProjectState = {
  active: ProjectSource;
  directory: Record<ProjectSource, Project>;
}

function initial(): ProjectState {
  return {
    active: 'global',
    directory: {
      global: {
        loaded: false,
      },
      local: {
        loaded: false,
        config: defaultLocalConfig(),
      },
    },
  }
}
function defaultLocalConfig(): bulk.BulkProjectConfig {
  return {
    type: 'Bulk',
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
    const { source } = action.meta.arg

    state.directory[source] = {
      loaded: true,
      failed: true,
    }
  })

  builder.addCase(actions.loadProjectConfig.fulfilled, (state, action) => {
    const { config } = action.payload
        , { source } = action.meta.arg

    state.directory[source] = {
      loaded: false,
      config,
    }
  })

  builder.addCase(actions.loadProject.fulfilled, (state, action) => {
    const { source } = action.meta.arg

    state.directory[source] = action.payload
    state.active = source

  })
})

export default reducer
