import * as R from 'ramda'

import {
  createAction,
  asyncActionCreatorWithConfig
} from '@dredge/main'

import {
  SingleCellViewState,
  TranscriptWithClusterDGE,
  TranscriptImageMap,
  SingleCellSortPath,
  TableSortOrder
} from './types'

import { getTranscriptLookup } from './utils'


export * from '@dredge/shared/actions'

const createAsyncAction = asyncActionCreatorWithConfig<{
  state: SingleCellViewState,
}>()

function sortTranscripts(
  transcripts: TranscriptWithClusterDGE[],
  transcriptImages: TranscriptImageMap,
  sortPath: SingleCellSortPath,
  sortOrder: TableSortOrder
) {
  let getter: (d: TranscriptWithClusterDGE) => (string | number | null)

  if (sortPath === 'transcript') {
    getter = d => d.transcript.label.toLowerCase()
  } else if (sortPath === 'hasInsitu') {
    getter = d => transcriptImages.has(d.transcript.id) ? 0 : 1
  } else {
    getter = d => {
      const dge = d.dgeByCluster.get(sortPath.cluster)
      if (!dge) return null
      return dge[sortPath.value]
    }
  }

  const comparator = (sortOrder === 'asc' ? R.ascend : R.descend)(R.identity)

  return R.sort(
    (a, b) => {
      const aVal = getter(a)
          , bVal = getter(b)

      if (aVal == null) return 1
      if (bVal == null) return -1

      return comparator(aVal, bVal)
    },
    transcripts)
}

function intersection<T>(a: Set<T>, b: Set<T>) {
  const common = new Set<T>()

  a.forEach(x => {
    if (b.has(x)) {
      common.add(x)
    }
  })

  return common
}

export const updateDisplayedSingleCellTranscripts = createAsyncAction<
  {},
  {
    displayedTranscripts: TranscriptWithClusterDGE[]
  }
>('update-displayed-sc-transcripts', async (args, { getState }) => {
  const { selectedClusters, project, sortPath, order } = getState()
      , { transcriptImages, transcriptsWithClusters } = project.data
      , getCanonicalTranscriptLabel = getTranscriptLookup(project)

  let displayedTranscripts: TranscriptWithClusterDGE[] = [...transcriptsWithClusters].map(
    ([ transcriptID, clusters ]) => ({
      transcript: {
        id: transcriptID,
        label: getCanonicalTranscriptLabel(transcriptID) || transcriptID,
      },
      dgeByCluster: new Map([...clusters].map(cluster => [ cluster.clusterID, cluster ])),
    }))

  if (selectedClusters.size) {
    displayedTranscripts = displayedTranscripts.filter(
      ({ dgeByCluster }) => intersection(new Set(dgeByCluster.keys()), selectedClusters).size > 0)
  }

  return {
    displayedTranscripts: sortTranscripts(displayedTranscripts, transcriptImages, sortPath, order),
  }
})

export const setSelectedClusters = createAction<
  { clusters: Set<string> }
>('set-selected-clusters')

export const setHoveredCluster = createAction<
  SingleCellViewState["hoveredCluster"]
>('set-hovered-cluster')

export const setSelectedTranscripts = createAction<
  { transcripts: Set<string> }
>('set-selected-transcripts')

export const clearSelectedTranscripts = createAction('clear-selected-transcripts')

export const setViewSort = createAction<
  {
    path: SingleCellSortPath,
    order: TableSortOrder,
  }
>('update-sc-sort-path')
