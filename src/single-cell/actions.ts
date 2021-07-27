import * as R from 'ramda'

import {
  createAction,
  asyncActionCreatorWithConfig
} from '@dredge/main'

import {
  SingleCellViewState,
  ClusterDGE,
  TranscriptWithClusterDGE,
  TranscriptImageMap,
  SingleCellSortPath,
  TableSortOrder,
  SeuratCluster
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

export const updateDisplayedSingleCellTranscripts = createAsyncAction<
  {},
  {
    displayedTranscripts: TranscriptWithClusterDGE[]
  }
>('update-displayed-sc-transcripts', async (args, { getState }) => {
  const { selectedClusters, project, sortPath, order } = getState()
      , { transcriptImages } = project.data

  if (!selectedClusters) {
    return {
      displayedTranscripts: [],
    }
  }

  const getCanonicalTranscriptLabel = getTranscriptLookup(project)
      , dgesByTranscript: Map<string, Set<ClusterDGE>> = new Map()

  project.data.differentialExpressions.forEach(dge => {
    if (!selectedClusters.has(dge.clusterID)) return

    if (!dgesByTranscript.has(dge.transcriptID)) {
      dgesByTranscript.set(dge.transcriptID, new Set())
    }

    dgesByTranscript.get(dge.transcriptID)!.add(dge)
  })

  const displayedTranscripts = [...dgesByTranscript].map(([ transcript, clusters ]) => ({
    transcript: {
      id: transcript,
      label: getCanonicalTranscriptLabel(transcript) || transcript,
    },
    dgeByCluster: new Map([...clusters].map(cluster => [ cluster.clusterID, cluster ])),
  }))

  return {
    displayedTranscripts: sortTranscripts(displayedTranscripts, transcriptImages, sortPath, order),
  }
})

export const setSelectedClusters = createAction<
  { clusters: Set<string> | null }
>('set-selected-clusters')

export const setHoveredCluster = createAction<
  { cluster: SeuratCluster | null }
>('set-hovered-cluster')

export const setSelectedTranscripts = createAction<
  { transcripts: Set<string> }
>('set-selected-transcripts')

export const setViewSort = createAction<
  {
    path: SingleCellSortPath,
    order: TableSortOrder,
  }
>('update-sc-sort-path')
