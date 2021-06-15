import {
  createAction,
  asyncActionCreatorWithConfig
} from '@dredge/main'

import {
  SingleCellViewState,
  ClusterDGE,
  TranscriptWithClusterDGE
} from './types'

export * from '@dredge/shared/actions'

const createAsyncAction = asyncActionCreatorWithConfig<{
  state: SingleCellViewState,
}>()

export const updateDisplayedSingleCellTranscripts = createAsyncAction<
  {},
  {
    displayedTranscripts: TranscriptWithClusterDGE[]
  }
>('update-displayed-sc-transcripts', async (args, { getState }) => {
  const { selectedClusters, project } = getState()

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
    displayedTranscripts,
  }
})

export const setSelectedClusters = createAction<
  { clusters: Set<string> | null }
>('set-selected-clusters')
