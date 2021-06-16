import * as d3 from 'd3'

import * as singleCellFields from './fields'

import {
  fields as commonFields,
  buildTranscriptCorpus
} from '@dredge/shared'

import { CreateFieldLogger } from '@dredge/log'

import { SingleCellConfiguration } from './config'

import {
  ProjectSource,
  SingleCellProject
} from '@dredge/main'

import {
  SeuratCell,
  SeuratCellMap,
  SeuratCluster,
  SeuratClusterMap,
  TranscriptImageMap
} from './types'

export const labels: Map<keyof SingleCellConfiguration, string> = new Map([
  ['label', 'Project label'],
  ['readme', 'Project documentation'],
  ['transcriptHyperlink', 'Transcript hyperlink'],
  ['transcriptImages', 'Transcript images'],
  ['seuratEmbeddings', 'Seurat UMAP embedding coordinates'],
  ['seuratMetadata', 'Seurat cell metadata'],
  ['transcripts', 'List of transcripts'],
  ['expressionData', 'Transcript expression data'],
])

function mean(vals: number[]) {
  return vals.reduce((a, b) => a + b) / vals.length
}

function colorClusters(
  clusters: Map<string, Omit<SeuratCluster, 'color'>>,
  bounds: [number, number, number, number]
) {
  const clustersWithColors = new Map() as SeuratClusterMap

  const tree = d3.quadtree(
    [...clusters.values()],
    d => d.midpoint[0],
    d => d.midpoint[1])

  const [ umap1Min, umap2Min, umap1Max, umap2Max ] = bounds
      , center = [ mean([umap1Min, umap1Max]), mean([umap2Min, umap2Max]) ] as [number, number]

  let colorIndex = 0

  const colorScale = d3.schemeCategory10

  while (tree.data().length) {
    const cluster = tree.find(center[0], center[1])

    // This should never happen!
    if (!cluster) {
      throw new Error('Could not locate cluster given center point. Do all clusters have UMAP values?')
    }

    clustersWithColors.set(cluster.id, {
      ...cluster,
      color: colorScale[colorIndex % colorScale.length]!,
    })

    tree.remove(cluster)

    colorIndex += 1
  }

  return clustersWithColors
}

function getClusters(cellMap: SeuratCellMap) {
  const cellsByCluster = new Map() as Map<string, SeuratCell[]>

  let umap1Min = Infinity
    , umap2Min = Infinity
    , umap1Max = -Infinity
    , umap2Max = -Infinity

  for (const cell of cellMap.values()) {
    const { clusterID } = cell

    if (!cellsByCluster.has(clusterID)) {
      cellsByCluster.set(clusterID, [])
    }

    if (cell.umap1 < umap1Min) umap1Min = cell.umap1
    if (cell.umap2 < umap2Min) umap2Min = cell.umap2
    if (cell.umap1 > umap1Max) umap1Max = cell.umap1
    if (cell.umap2 > umap2Max) umap2Max = cell.umap2

    cellsByCluster.get(clusterID)!.push(cell)
  }

  const clustersWithoutColor = new Map([...cellsByCluster].map(([ clusterID, cells ]) => [
    clusterID, {
      id: clusterID,
      label: clusterID,
      cells,
      midpoint: [
        mean(cells.map(x => x.umap1)),
        mean(cells.map(x => x.umap2)),
      ] as [number, number],
    },
  ]))


  return colorClusters(clustersWithoutColor, [umap1Min, umap1Max, umap2Min, umap2Max])
}

export async function loadProject(
  source: ProjectSource,
  config: SingleCellConfiguration,
  projectStatusLog: (message: string) => void,
  makeLog: CreateFieldLogger
): Promise<SingleCellProject> {
  const [
    embeddings,
    metadata,
    expressionData,
    differentialExpressions,
    transcripts,
    transcriptImages,
    readme,
  ] = await Promise.all([
    singleCellFields.embeddings.validateFromURL(
      config.seuratEmbeddings, makeLog),

    singleCellFields.metadata.validateFromURL(
      config.seuratMetadata, makeLog),

    singleCellFields.expressionData.validateFromURL(
      config.expressionData, makeLog),

    singleCellFields.differentialExpressions.validateFromURL(
      config.differentialExpressions, makeLog),

    commonFields.aliases.validateFromURL(
      config.transcripts, makeLog),

    singleCellFields.transcriptImages.validateFromURL(
      config.transcriptImages, makeLog),

    commonFields.readme.validateFromURL(
      config.readme, makeLog),
  ])

  if (
    embeddings === null ||
    metadata === null ||
    expressionData === null ||
    differentialExpressions === null ||
    transcripts === null
  ) {
    projectStatusLog('Could not load project.')
    throw new Error()
  }

  const embeddingMap = new Map(
    embeddings.map(x => ([ x.cellID, x])))

  const metadataMap = new Map(
    metadata.map(x => ([ x.cellID, x])))

  const allCells = new Set([...embeddingMap.keys(), ...metadataMap.keys()])
      , cellMap: SeuratCellMap = new Map()

  for (const cellID of allCells) {
    const embedding = embeddingMap.get(cellID)
        , metadata = metadataMap.get(cellID)

    if (!embedding) {
      projectStatusLog(`Cell ${cellID} was in Seurat metadata, but not in Seurat embeddings`)
      throw new Error()
    }

    if (!metadata) {
      projectStatusLog(`Cell ${cellID} was in Seurat embeddings, but not in Seurat metadata`)
      throw new Error()
    }

    cellMap.set(cellID, {
      ...metadata,
      ...embedding,
    })
  }

  const { corpus, transcriptAliases } = await buildTranscriptCorpus(Object.keys(transcripts), transcripts)

  differentialExpressions.forEach(dge => {
    const realTranscriptID = corpus[dge.transcriptID]
    if (!realTranscriptID) {
      projectStatusLog(`Transcript ${dge.transcriptID} was referenced in differential expression file, but is not a valid transcript`)
      throw new Error()
    }
    dge.transcriptID = realTranscriptID
  })

  projectStatusLog('Indexing clusters...')

  const clusters = await getClusters(cellMap)

  const transcriptImageMap: TranscriptImageMap = new Map()

  if (transcriptImages) {
    transcriptImages.forEach(obj => {
      const transcriptID = corpus[obj.transcript]

      if (!transcriptID) return;

      if (!transcriptImageMap.has(transcriptID)) {
        transcriptImageMap.set(transcriptID, [])
      }

      transcriptImageMap.get(transcriptID)!.push({
        transcriptID,
        filename: obj.filename,
        title: obj.title,
      })
    })
  }

  return {
    type: 'SingleCell',
    source,
    config,
    data: {
      cells: cellMap,
      clusters,
      expressionData,
      differentialExpressions,
      transcripts: Object.keys(transcripts),
      transcriptCorpus: corpus,
      transcriptAliases,
      transcriptImages: transcriptImageMap,
      readme,
    },
  }
}
