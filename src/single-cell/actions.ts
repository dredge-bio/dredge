
export const updateDisplayedSingleCellTranscripts = createAsyncAction<
  {
    view: SingleCellViewState,
  },
  {
    displayedTranscripts: TranscriptWithClusterDGE[]
  }
>('update-displayed-sc-transcripts', async args => {
  const { selectedClusters, project } = args.view

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
