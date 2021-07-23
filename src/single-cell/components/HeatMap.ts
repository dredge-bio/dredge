import h from 'react-hyperscript'
import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { useSized } from '@dredge/main'
import { useView, useSeuratDataset } from '../hooks'
import { SeuratClusterMap } from '../types'

const transcripts = [
  'ttc36',
  'sap3',
  'star',
]

const PADDING_LEFT = 16
    , PADDING_RIGHT = 16
    , PADDING_TOP = 16
    , CLUSTER_LEGEND_HEIGHT = 60
    , CLUSTER_LEGEND_BAR_HEIGHT = 16
    , GRID_GAP = 3
    , CLUSTER_LEGEND_GAP = 10
    , TEXT_GAP = 6
    , TRANSCRIPT_LABEL_WIDTH = 144
    , CLUSTERS_START_TOP = PADDING_TOP + CLUSTER_LEGEND_HEIGHT
    , CLUSTERS_START_LEFT = PADDING_LEFT + TRANSCRIPT_LABEL_WIDTH + TEXT_GAP
    , LEGEND_PADDING_TOP = 20
    , LEGEND_TICKS = 1000
    , LEGEND_WIDTH = 300
    , CLUSTER_GRID_HEIGHT = 100

function drawHeatmapWithBlocks(
  canvasEl: HTMLCanvasElement,
  clusterMap: SeuratClusterMap,
  scDataset: ReturnType<typeof useSeuratDataset>,
  rect: { width: number, height: number }
) {
  const clusters = [...clusterMap.keys()]

  const zScoresByTranscript = new Map(transcripts.map(transcript => {
    const zScoresForTranscript = scDataset.getScaledCountsForTranscript(transcript)

    const clusterMap: Map<string, number[]> = new Map(
      clusters.map(cluster => [ cluster, [] ]))

    zScoresForTranscript.forEach((zScore, cell) => {
      if (!clusterMap.has(cell.clusterID)) return
      clusterMap.get(cell.clusterID)!.push(zScore)
    })

    return [ transcript, clusterMap ]
  }))

  const ctx = canvasEl.getContext('2d')!

  const colorScale = d3.scaleLinear<string>()
    .domain([ -1, 1, 2 ])
    .range([ '#ff00ff', 'black', 'yellow' ])
    .clamp(true)

  const w = (rect.width - CLUSTERS_START_LEFT - PADDING_RIGHT) / clusters.length
      , h = CLUSTER_GRID_HEIGHT / transcripts.length

  // ctx.scale(.1, .1)
  let clustersDrawn = false

  Array.from(zScoresByTranscript).forEach(([ transcript, zScoresByCluster ], transcriptIdx) => {
    if (transcriptIdx > 0) {
      clustersDrawn = true
    }

    // Draw the transcript labels
    ctx.fillStyle = 'black'
    ctx.textAlign = 'end'
    ctx.textBaseline = 'middle'
    ctx.font = '24px sans-serif'
    ctx.fillText(
      transcript,
      CLUSTERS_START_LEFT - TEXT_GAP + GRID_GAP,
      CLUSTERS_START_TOP + transcriptIdx * h + h / 2,
      TRANSCRIPT_LABEL_WIDTH)

    Array.from(zScoresByCluster).forEach(([ clusterID, zScoresByCell ], clusterIdx) => {
      const cluster = clusterMap.get(clusterID)!
          , clusterStart = CLUSTERS_START_LEFT + w * clusterIdx

      if (!clustersDrawn) {
        // Draw the cluster legend
        const legendBarStartY = CLUSTERS_START_TOP - CLUSTER_LEGEND_GAP - CLUSTER_LEGEND_BAR_HEIGHT

        // Draw the cluster bars
        ctx.fillStyle = cluster.color
        ctx.fillRect(
          clusterStart + GRID_GAP,
          legendBarStartY,
          w - GRID_GAP,
          CLUSTER_LEGEND_BAR_HEIGHT)

        // Draw the cluster label
        ctx.fillStyle = 'black'
        ctx.textBaseline = 'alphabetic'
        ctx.textAlign = 'center'
        ctx.font = '24px sans-serif'
        ctx.fillText(
          cluster.label,
          clusterStart + w / 2,
          legendBarStartY - TEXT_GAP,
          w)
      }

      // Draw the cluster z score for this transcript
      const meanZScore = d3.mean(zScoresByCell)!
      ctx.fillStyle = colorScale(meanZScore)
      ctx.fillRect(
        clusterStart + GRID_GAP,
        CLUSTERS_START_TOP + transcriptIdx * h,
        w - GRID_GAP,
        h)
    })
  })

  const legendTicks = [0, 1, 2]
      , tickScale = d3.scaleLinear().range([CLUSTERS_START_LEFT, CLUSTERS_START_LEFT + LEGEND_WIDTH]).domain([-1, 2])
      , ticks = colorScale.ticks(LEGEND_TICKS)
      , tickWidth = Math.ceil(tickScale(ticks[1]!) - tickScale(ticks[0]!))

  const legendTop = CLUSTERS_START_TOP + transcripts.length * h + LEGEND_PADDING_TOP

  // Draw the colors on the color scale
  colorScale.ticks(LEGEND_TICKS).forEach(num => {
    ctx.fillStyle = colorScale(num)
    ctx.fillRect(
      tickScale(num),
      legendTop,
      tickWidth,
      h)
  })

  // Draw a few ticks on the color scale
  legendTicks.forEach(val => {
    ctx.fillStyle = 'black'
    ctx.font = '24px sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillText(
      val.toString(),
      tickScale(val),
      legendTop + h + TEXT_GAP)
  })
}

export default function HeatMap() {
  const scDataset = useSeuratDataset()
      , [ ref, rect ] = useSized()
      , canvasRef = useRef<HTMLCanvasElement | null>(null)
      , view = useView()
      , { clusters } = view.project.data

  useEffect(() => {
    const canvasEl = canvasRef.current

    if (canvasEl === null || rect === null) return

    drawHeatmapWithBlocks(canvasEl, clusters, scDataset, rect)
  }, [ canvasRef.current ])

  return (
    h('div', {
      ref,
      style: {
        background: 'white',
        height: '100%',
      },
    }, [
      rect && h('canvas', {
        ref: canvasRef,
        x: 0,
        y: 0,
        height: rect.height,
        width: rect.width,
      }),
    ])
  )
}
