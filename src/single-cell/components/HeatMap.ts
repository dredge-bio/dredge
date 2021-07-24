import h from 'react-hyperscript'
import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { useSized } from '@dredge/main'
import { useView, useSeuratDataset } from '../hooks'
import { SeuratCluster } from '../types'

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
    , TRANSCRIPT_LABEL_WIDTH = 120
    , LEGEND_PADDING_TOP = 20
    , SCALE_HEIGHT = 56
    , SCALE_LEGEND_HEIGHT = 10
    , SCALE_TICKS = 1000
    , SCALE_WIDTH = 300

type CanvasText = {
  text: string;
  font: string;
  color: string;
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
  x: number;
  y: number;
  maxWidth?: number;
}

type CanvasRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

type HeatMapSquare = CanvasRect & {
  transcript: string;
}

type HeatMapCluster = {
  x: number;
  y: number;
  w: number;
  h: number;
  squares: HeatMapSquare[];
  legend: {
    bar: CanvasRect;
    label: CanvasText;
  };
}

type HeatMapData = {
  clusters: HeatMapCluster[];
  transcriptLabels: CanvasText[];
  scale: {
    marks: CanvasRect[];
    labels: CanvasText[];
  };
}

type ZScoreByCluster = Map<string, {
  cluster: SeuratCluster;
  transcripts: Map<string, number[]>;
}>

function drawRect(
  ctx: CanvasRenderingContext2D,
  rect: CanvasRect
) {
  ctx.fillStyle = rect.color
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: CanvasText
) {
  ctx.fillStyle = text.color
  ctx.textBaseline = text.baseline
  ctx.textAlign = text.align
  ctx.font = text.font
  ctx.fillText(text.text, text.x, text.y, text.maxWidth)
}


function heatmapDimensions(
  rect: { width: number, height: number },
  transcripts: string[],
  zScoresByCluster: ZScoreByCluster
): HeatMapData {
  const { height, width } = rect

  const colorScale = d3.scaleLinear<string>()
    .domain([ -1, 1, 2 ])
    .range([ '#ff00ff', 'black', 'yellow' ])
    .clamp(true)

  const gridX = PADDING_LEFT + TRANSCRIPT_LABEL_WIDTH + TEXT_GAP
      , gridY = PADDING_TOP + CLUSTER_LEGEND_HEIGHT

  const grid = {
    x: gridX,
    y: gridY,
    w: (width - gridX - PADDING_RIGHT) / zScoresByCluster.size,
    h: (height - gridY - SCALE_HEIGHT) / (transcripts.length + 1),
  }

  const clusters: HeatMapCluster[] = [...zScoresByCluster.values()].map((cluster, clusterIdx) => {
    const clusterStartX = grid.x + clusterIdx * grid.w

    const squares = Array.from(cluster.transcripts).map(([ transcript, zScores ], transcriptIdx) => ({
      transcript,
      x: clusterStartX + GRID_GAP,
      y: grid.y + transcriptIdx * grid.h,
      w: grid.w - GRID_GAP,
      h: grid.h,
      color: colorScale(d3.mean(zScores)!),
    }))

    const bar = {
      x: clusterStartX + GRID_GAP,
      y: grid.y - CLUSTER_LEGEND_GAP - CLUSTER_LEGEND_BAR_HEIGHT,
      w: grid.w - GRID_GAP,
      h: CLUSTER_LEGEND_BAR_HEIGHT,
      color: cluster.cluster.color,
    }

    const label = {
      text: cluster.cluster.label,
      color: 'black',
      font: '24px sans-serif',
      align: 'center' as CanvasTextAlign,
      baseline: 'alphabetic' as CanvasTextBaseline,
      x: clusterStartX + grid.w / 2,
      y: bar.y - TEXT_GAP,
    }

    let maxY = bar.y + bar.h

    const lastSquare = squares.slice(-1)[0]

    if (lastSquare) {
      maxY = lastSquare.y + lastSquare.h
    }

    return {
      x: bar.x,
      y: bar.y,
      w: bar.w,
      h: maxY - bar.y,
      squares,
      legend: {
        bar,
        label,
      },
    }
  })

  const tickScale = d3.scaleLinear()
    .range([grid.x, grid.x + SCALE_WIDTH])
    .domain(d3.extent(colorScale.domain()) as [ number, number ])

  const scaleTop = height - SCALE_HEIGHT
      , ticks = colorScale.ticks(SCALE_TICKS)
      , tickWidth = Math.ceil(tickScale(ticks[1]!) - tickScale(ticks[0]!))
      , scaleLabels = [ 0, 1, 2 ]

  const scale = {
    marks: ticks.map(num => ({
      color: colorScale(num),
      x: tickScale(num),
      y: scaleTop,
      w: tickWidth,
      h: SCALE_LEGEND_HEIGHT,
    })),
    labels: scaleLabels.map(num => ({
      text: num.toString(),
      font: '24px sans-serif',
      color: 'black',
      baseline: 'top' as CanvasTextBaseline,
      align: 'center' as CanvasTextAlign,
      x: tickScale(num),
      y: scaleTop + SCALE_LEGEND_HEIGHT + TEXT_GAP,
    })),
  }

  const transcriptLabels = transcripts.map((transcript, idx) => ({
    text: transcript,
    color: 'black',
    font: '24px sans-serif',
    align: 'right' as CanvasTextAlign,
    baseline: 'middle' as CanvasTextBaseline,
    x: grid.x - TEXT_GAP + GRID_GAP,
    y: grid.y + idx * grid.h + grid.h / 2,
  }))

  return {
    scale,
    clusters,
    transcriptLabels,
  }
}

function drawHeatmapWithBlocks(
  canvasEl: HTMLCanvasElement,
  clusters: SeuratCluster[],
  scDataset: ReturnType<typeof useSeuratDataset>,
  rect: { width: number, height: number }
) {
  const zScores: ZScoreByCluster = new Map()

  clusters.forEach(cluster => {
    zScores.set(cluster.id, {
      cluster,
      transcripts: new Map(transcripts.map(transcript => [ transcript, [] ])),
    })
  })

  transcripts.forEach(transcript => {
    const zScoresForTranscript = scDataset.getScaledCountsForTranscript(transcript)

    zScoresForTranscript.forEach((zScore, cell) => {
      if (!zScores.has(cell.clusterID)) return
      zScores.get(cell.clusterID)!.transcripts.get(transcript)!.push(zScore)
    })
  })

  const heatmap = heatmapDimensions(rect, transcripts, zScores)

  const ctx = canvasEl.getContext('2d')!

  heatmap.clusters.forEach(cluster => {
    cluster.squares.forEach(square => {
      drawRect(ctx, square)
    })

    drawRect(ctx, cluster.legend.bar)
    drawText(ctx, cluster.legend.label)
  })

  heatmap.transcriptLabels.forEach(label => {
    drawText(ctx, label)
  })

  heatmap.scale.marks.forEach(rect => {
    drawRect(ctx, rect)
  })

  heatmap.scale.labels.forEach(text => {
    drawText(ctx, text)
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

    drawHeatmapWithBlocks(canvasEl, Array.from(clusters.values()), scDataset, rect)
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
