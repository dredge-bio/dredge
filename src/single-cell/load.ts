import * as R from 'ramda'
import * as d3 from 'd3'

import * as singleCellFields from './fields'
import { DBSCAN } from 'density-clustering'

import {
  fields as commonFields,
  buildTranscriptCorpus
} from '@dredge/shared'

import { CreateFieldLogger } from '@dredge/log'

import { SingleCellConfiguration } from './config'

import {
  delay,
  ProjectSource,
  SingleCellProject
} from '@dredge/main'

import {
  SeuratCell,
  SeuratCellMap,
  SeuratCluster,
  SeuratClusterMap,
  TranscriptImageMap,
  ClusterDGE
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
  ['clusterLevels', 'Seurat cluster levels'],
])

function mean(vals: number[]) {
  return vals.reduce((a, b) => a + b) / vals.length
}

function colorClusters(
  clusterLevels: string[],
  clusters: Map<string, Omit<SeuratCluster, 'color'>>
) {
  const orderedClusterMap: SeuratClusterMap = new Map()
      , hueScale = d3.scaleLinear().domain([0, clusters.size - 1]).range([30, 360])
      , C = 62
      , L = 65

  let idx = 0

  clusterLevels.forEach(clusterID => {
    const cluster = clusters.get(clusterID)

    // This is a cluster defined in clusterLevels without any cells assigned
    // to it. This probably should never happen? But we can just skip it if
    // it does.
    if (!cluster) {
      return
    }
    const hue = hueScale(idx)

    orderedClusterMap.set(clusterID, {
      ...cluster,
      color: d3.hcl(hue, hue > 180 ? C + 14 : C, L).toString(),
    })

    idx += 1
  })

  return orderedClusterMap
}

function getClusters(clusterLevels: string[], cellMap: SeuratCellMap) {
  const cellsByCluster = new Map() as Map<string, SeuratCell[]>

  let umap1Min = Infinity
    , umap2Min = Infinity
    , umap1Max = -Infinity
    , umap2Max = -Infinity

  for (const cell of cellMap.values()) {
    const { clusterID } = cell

    if (!clusterLevels.includes(clusterID)) {
      throw new Error(`Cell ${cell.cellID} has the cluster ${clusterID}, but this cluster is not in the defined cluster levels`)
    }

    if (!cellsByCluster.has(clusterID)) {
      cellsByCluster.set(clusterID, [])
    }

    if (cell.umap1 < umap1Min) umap1Min = cell.umap1
    if (cell.umap2 < umap2Min) umap2Min = cell.umap2
    if (cell.umap1 > umap1Max) umap1Max = cell.umap1
    if (cell.umap2 > umap2Max) umap2Max = cell.umap2

    cellsByCluster.get(clusterID)!.push(cell)
  }

  const clustersWithoutColor = new Map([...cellsByCluster].map(([ clusterID, cells ]) => {
    const dbscan = new DBSCAN()

    const cellPositions = cells.map(cell => [cell.umap1, cell.umap2])

    const cellClusters = dbscan.run(cellPositions, 1, 1)
      .map(cellCluster => {
        const clusterCells = cellCluster.map(i => cells[i]!)
            , umap1Midpoint = mean(clusterCells.map(x => x.umap1))
            , umap2Midpoint = mean(clusterCells.map(x => x.umap2))

        return {
          cells: clusterCells,
          midpoint: [umap1Midpoint, umap2Midpoint] as [number, number],
        }
      })

    const biggestCluster = R.last(R.sortBy(x => x.cells.length, cellClusters))!

    return [
      clusterID, {
        id: clusterID,
        label: clusterID,
        cellClusters,
        cells,
        midpoint: biggestCluster.midpoint,
      },
    ]
  }))

  return colorClusters(clusterLevels, clustersWithoutColor)
}

export async function loadProject(
  source: ProjectSource,
  config: SingleCellConfiguration,
  projectStatusLog: (message: string) => void,
  makeLog: CreateFieldLogger
): Promise<SingleCellProject> {
  const [
    embeddings,
    clusterLevels,
    metadata,
    expressionData,
    differentialExpressions,
    transcripts,
    transcriptImages,
    readme,
  ] = await Promise.all([
    singleCellFields.embeddings.validateFromURL(
      config.seuratEmbeddings, makeLog),

    singleCellFields.clusterLevels.validateFromURL(
      config.clusterLevels, makeLog),

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
    clusterLevels === null ||
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

  projectStatusLog('Indexing differential expressions...')

  const transcriptsWithClusters: Map<string, ClusterDGE[]> = new Map()

  differentialExpressions.forEach(dge => {
    const realTranscriptID = corpus[dge.transcriptID]

    if (!realTranscriptID) {
      projectStatusLog(`Transcript ${dge.transcriptID} was referenced in differential expression file, but is not a valid transcript`)
      throw new Error()
    }

    if (!transcriptsWithClusters.has(realTranscriptID)) {
      transcriptsWithClusters.set(realTranscriptID, [])
    }

    dge.transcriptID = realTranscriptID
    transcriptsWithClusters.get(realTranscriptID)!.push(dge)
  })

  projectStatusLog('Indexing clusters...')

  await delay(0)

  const clusters = await getClusters(clusterLevels, cellMap)

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
      transcriptsWithClusters,
      transcripts: Object.keys(transcripts),
      transcriptCorpus: corpus,
      transcriptAliases,
      transcriptImages: transcriptImageMap,
      readme,
    },
  }
}
