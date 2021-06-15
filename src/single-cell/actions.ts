import * as R from 'ramda'

import {
  createAction,
  asyncActionCreatorWithConfig
} from '@dredge/main'

import { TableSortOrder } from '@dredge/shared'

import {
  SingleCellViewState,
  ClusterDGE,
  TranscriptWithClusterDGE,
  SingleCellSortPath
} from './types'

export * from '@dredge/shared/actions'

const createAsyncAction = asyncActionCreatorWithConfig<{
  state: SingleCellViewState,
}>()

function sortTranscripts(
  transcripts: TranscriptWithClusterDGE[],
  sortPath: SingleCellSortPath,
  sortOrder: TableSortOrder
) {
  let getter: (d: TranscriptWithClusterDGE) => (string | number | null)

  if (typeof sortPath === 'string') {
    getter = d => d.transcript
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

  if (!selectedClusters) {
    return {
      displayedTranscripts: [],
    }
  }

  const dgesByTranscript: Map<string, Set<ClusterDGE>> = new Map()

  project.data.differentialExpressions.forEach(dge => {
    if (!selectedClusters.has(dge.clusterID)) return

    if (!dgesByTranscript.has(dge.transcriptID)) {
      dgesByTranscript.set(dge.transcriptID, new Set())
    }

    dgesByTranscript.get(dge.transcriptID)!.add(dge)
  })

  const displayedTranscripts = [...dgesByTranscript].map(([ transcript, clusters ]) => ({
    transcript,
    dgeByCluster: new Map([...clusters].map(cluster => [ cluster.clusterID, cluster ])),
  }))

  return {
    displayedTranscripts: sortTranscripts(displayedTranscripts, sortPath, order),
  }
})

export const setSelectedClusters = createAction<
  { clusters: Set<string> | null }
>('set-selected-clusters')
