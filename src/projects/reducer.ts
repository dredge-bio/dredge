import {
  ProjectSource,
  DredgeConfig,
  Project,
} from '../ts_types'

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
})

export default reducer

/*
    Pending: () => action.type.case({
      LoadProject(source) {
        return Object.assign({}, state, {
          view: blankView(source),
        })
      },

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



    SUCCESS
    ===

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
    */
