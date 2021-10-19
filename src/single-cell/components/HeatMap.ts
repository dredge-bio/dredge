import { createElement as h } from 'react'
import styled from 'styled-components'
import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'
import { useSized, formatNumber } from '@dredge/main'
import { useView, useViewDispatch, useSeuratDataset } from '../hooks'
import { SeuratCluster } from '../types'
import * as viewActions from '../actions'

const PADDING_LEFT = 16
    , PADDING_RIGHT = 16
    , PADDING_TOP = 16
    , CLUSTER_LEGEND_HEIGHT = 60
    , CLUSTER_LEGEND_BAR_HEIGHT = 16
    , GRID_MAX_SQUARE_HEIGHT = 30
    , GRID_GAP = 3
    , CLUSTER_LEGEND_GAP = 10
    , TEXT_GAP = 6
    , TRANSCRIPT_LABEL_WIDTH = 120
    , TRANSCRIPT_LABEL_DEFAULT_FONT_SIZE = 20
    , SCALE_PADDING_TOP = 16
    , SCALE_HEIGHT = 56
    , SCALE_LEGEND_HEIGHT = 10
    , SCALE_TICKS = 1000
    , SCALE_WIDTH = 300
    , GRID_HOVER_OUTLINE_WIDTH = 3
    , GRID_HOVER_OUTLINE_COLOR = 'black'

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
  cluster: SeuratCluster;
  transcript: string;
  meanZScore: number;
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
  clusterPositions: Map<SeuratCluster, CanvasRect>,
  transcriptPositions: Map<string, CanvasRect>,
  grid: {
    squareW: number;
    squareH: number;

    // FIXME: clusterIdx parameter is not necessary if we already have the cluster list
    getTranscriptSquare: (
      transcript: string,
      transcriptIdx: number,
      cluster: SeuratCluster,
      clusterIdx: number,
      zScores: number[]
    ) => HeatMapSquare,
    x: number;
    y: number;
    w: number;
    h: number;
    clusters: HeatMapCluster[];
  },
  transcriptLabels: {
    x: number;
    y: number;
    w: number;
    h: number;
    getTranscriptText: (
      transcript: string,
      transcriptIdx: number,
    ) => CanvasText,
    labels: CanvasText[];
  },
  scale: {
    x: number;
    y: number;
    w: number;
    h: number;
    marks: CanvasRect[];
    labels: CanvasText[];
  };
}

type ClusterZScores = {
  cluster: SeuratCluster;
  transcripts: Map<string, number[]>;
}

type ZScoreByCluster = Map<string, ClusterZScores>

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
      , clusterPositions: Map<SeuratCluster, CanvasRect> = new Map()
      , transcriptPositions: Map<string, CanvasRect> = new Map()

  const colorScale = d3.scaleLinear<string>()
    .domain([ -1, 1, 2 ])
    .range([ '#ff00ff', 'black', 'yellow' ])
    .clamp(true)

  const gridX = PADDING_LEFT + TRANSCRIPT_LABEL_WIDTH + TEXT_GAP
      , gridY = PADDING_TOP + CLUSTER_LEGEND_HEIGHT

  const grid = {
    x: gridX,
    y: gridY,
    w: (width - gridX - PADDING_RIGHT - GRID_GAP),
    squareW: (width - gridX - PADDING_RIGHT) / zScoresByCluster.size,
    h: (height - gridY - SCALE_HEIGHT - SCALE_PADDING_TOP),
    squareH: (height - gridY - SCALE_HEIGHT - SCALE_PADDING_TOP) / (transcripts.length + 1),
  }

  if (grid.squareH > GRID_MAX_SQUARE_HEIGHT) {
    grid.squareH = GRID_MAX_SQUARE_HEIGHT
  }

  const getClusterX = (clusterIdx: number) => grid.x + clusterIdx * grid.squareW

  const getTranscriptSquare = (
    transcript: string,
    transcriptIdx: number,
    cluster: SeuratCluster,
    clusterIdx: number,
    zScores: number[]
  ): HeatMapSquare => {
    const meanZScore = d3.mean(zScores)!

    return {
      transcript,
      cluster,
      meanZScore,
      x: getClusterX(clusterIdx) + GRID_GAP,
      y: grid.y + transcriptIdx * grid.squareH,
      w: grid.squareW - GRID_GAP,
      h: grid.squareH,
      color: colorScale(meanZScore),
    }
  }

  const clusters: HeatMapCluster[] = [...zScoresByCluster.values()].map((cluster, clusterIdx) => {
    const clusterStartX = getClusterX(clusterIdx)

    const squares = Array.from(cluster.transcripts).map(
      ([ transcript, zScores ], transcriptIdx) =>
        getTranscriptSquare(transcript, transcriptIdx, cluster.cluster, clusterIdx, zScores))

    const bar = {
      x: clusterStartX + GRID_GAP,
      y: grid.y - CLUSTER_LEGEND_GAP - CLUSTER_LEGEND_BAR_HEIGHT,
      w: grid.squareW - GRID_GAP,
      h: CLUSTER_LEGEND_BAR_HEIGHT,
      color: cluster.cluster.color,
    }

    const label = {
      text: cluster.cluster.label,
      color: 'black',
      font: '24px sans-serif',
      align: 'center' as CanvasTextAlign,
      baseline: 'alphabetic' as CanvasTextBaseline,
      x: clusterStartX + grid.squareW / 2,
      y: bar.y - TEXT_GAP,
    }

    let maxY = bar.y + bar.h

    const lastSquare = squares.slice(-1)[0]

    if (lastSquare) {
      maxY = lastSquare.y + lastSquare.h
    }

    clusterPositions.set(cluster.cluster, {
      color: 'black',
      x: bar.x,
      y: bar.y,
      w: bar.w,
      h: maxY - bar.y,
    })

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
    .range([grid.x + GRID_GAP, grid.x + GRID_GAP + SCALE_WIDTH])
    .domain(d3.extent(colorScale.domain()) as [ number, number ])

  const scaleTop = height - SCALE_HEIGHT
      , ticks = colorScale.ticks(SCALE_TICKS)
      , tickWidth = Math.ceil(tickScale(ticks[1]!) - tickScale(ticks[0]!))
      , scaleLabels = [ 0, 1, 2 ]

  const scale = {
    x: grid.x + GRID_GAP,
    y: scaleTop,
    w: SCALE_WIDTH,
    h: SCALE_HEIGHT,
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

  let fontSize = TRANSCRIPT_LABEL_DEFAULT_FONT_SIZE

  if (grid.squareH + 2 < fontSize) {
    fontSize = grid.squareH + 2
  }

  const getTranscriptText = (
    transcript: string,
    transcriptIdx: number
  ): CanvasText => ({
    text: transcript,
    color: 'black',
    font: `${fontSize}px SourceSansPro`,
    align: 'right' as CanvasTextAlign,
    baseline: 'middle' as CanvasTextBaseline,
    maxWidth: TRANSCRIPT_LABEL_WIDTH,
    x: grid.x - TEXT_GAP + GRID_GAP,
    y: grid.y + transcriptIdx * grid.squareH + grid.squareH / 2,
  })

  const labels = transcripts.map((transcript, idx) => getTranscriptText(transcript, idx))

  labels.forEach((text, i) => {
    const transcriptSquares = clusters.map(cluster => cluster.squares[i]!)
        , finalTranscriptSquare = transcriptSquares.slice(-1)[0]!
        , minX = transcriptSquares[0]!.x
        , maxX = finalTranscriptSquare.x + finalTranscriptSquare.w

    transcriptPositions.set(finalTranscriptSquare.transcript, {
      color: 'black',
      x: minX,
      y: finalTranscriptSquare.y,
      w: maxX - minX,
      h: finalTranscriptSquare.h,
    })
  })

  return {
    clusterPositions,
    transcriptPositions,
    scale,
    grid: {
      getTranscriptSquare,
      squareW: grid.squareW,
      squareH: grid.squareH,
      x: grid.x + GRID_GAP,
      y: grid.y,
      h: grid.h,
      w: grid.w,
      clusters,
    },
    transcriptLabels: {
      x: PADDING_LEFT,
      y: grid.y,
      w: TRANSCRIPT_LABEL_WIDTH + GRID_GAP + TEXT_GAP,
      h: grid.h,
      getTranscriptText,
      labels,
    },
  }
}

function drawHeatmapWithBlocks(
  canvasEl: HTMLCanvasElement,
  clusters: SeuratCluster[],
  transcripts: string[],
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

  ctx.clearRect(0, 0, rect.width, rect.height)

  heatmap.grid.clusters.forEach(cluster => {
    cluster.squares.forEach(square => {
      drawRect(ctx, square)
    })

    drawRect(ctx, cluster.legend.bar)
    drawText(ctx, cluster.legend.label)
  })

  heatmap.transcriptLabels.labels.forEach(label => {
    drawText(ctx, label)
  })

  heatmap.scale.marks.forEach(rect => {
    drawRect(ctx, rect)
  })

  heatmap.scale.labels.forEach(text => {
    drawText(ctx, text)
  })

  /*
  ctx.strokeStyle = '1px black'
  ctx.strokeRect(heatmap.scale.x, heatmap.scale.y, heatmap.scale.w, heatmap.scale.h)
  ctx.strokeRect(heatmap.grid.x, heatmap.grid.y, heatmap.grid.w, heatmap.grid.h)
  ctx.strokeRect(heatmap.transcriptLabels.x, heatmap.transcriptLabels.y, heatmap.transcriptLabels.w, heatmap.transcriptLabels.h)
  */

  function drawTranscriptRow(canvasEl: HTMLCanvasElement, transcript: string | null) {
    const ctx = canvasEl.getContext('2d')!
        , { getTranscriptText } = heatmap.transcriptLabels
        , { getTranscriptSquare } = heatmap.grid

    ctx.clearRect(0, 0, rect.width, rect.height)

    if (transcript === null) return

    // FIXME: This is a repeat of code fetching z-scores above
    const zScoresForTranscript = scDataset.getScaledCountsForTranscript(transcript)
        , zScores: ZScoreByCluster = new Map()

    clusters.forEach(cluster => {
      zScores.set(cluster.id, {
        cluster,
        transcripts: new Map([[ transcript, [] ]]),
      })
    })

    zScoresForTranscript.forEach((zScore, cell) => {
      if (!zScores.has(cell.clusterID)) return
      zScores.get(cell.clusterID)!.transcripts.get(transcript)!.push(zScore)
    })
    // end of repeat code

    const transcriptIdx = transcripts.length
        , text = getTranscriptText(transcript, transcriptIdx)

    const squares = Array.from(zScores.values()).map((clusterZScores, clusterIdx) => {
      const transcriptZScores = clusterZScores.transcripts.get(transcript)!

      return getTranscriptSquare(transcript, transcriptIdx, clusterZScores.cluster, clusterIdx, transcriptZScores)
    })

    squares.forEach(square => {
      drawRect(ctx, square)
    })

    drawText(ctx, text)
  }

  return {
    drawTranscriptRow,
    heatmap,
  }
}

const GridOverlayWrapper = styled.div`
  position: absolute;
`

export default function HeatMap() {
  const scDataset = useSeuratDataset()
      , dispatch = useViewDispatch()
      , [ ref, rect ] = useSized()
      , canvasRef = useRef<HTMLCanvasElement | null>(null)
      , hoverCanvasRef = useRef<HTMLCanvasElement | null>(null)
      , drawTranscriptRowRef = useRef<((canvasEl: HTMLCanvasElement, transcript: string | null) => void) | null>(null)
      , [ heatmap, setHeatmap ] = useState<HeatMapData | null>(null)
      , [ hoveredSquare, setHoveredSquare ] = useState<HeatMapSquare | null>(null)
      , view = useView()
      , { clusters } = view.project.data

  let hoveredGridCluster = hoveredSquare && heatmap && heatmap.clusterPositions.get(hoveredSquare.cluster)!

  if (heatmap && !hoveredSquare && view.hoveredCluster.cluster) {
    hoveredGridCluster = heatmap.clusterPositions.get(view.hoveredCluster.cluster)!
  }

  let hoveredGridTranscript = hoveredSquare && heatmap && heatmap.transcriptPositions.get(hoveredSquare.transcript)!

  if (heatmap && view.hoveredTranscript && heatmap.transcriptPositions.has(view.hoveredTranscript)) {
    hoveredGridTranscript = heatmap.transcriptPositions.get(view.hoveredTranscript)!
  }

  useEffect(() => {
    const canvasEl = canvasRef.current
        , hoverCanvasEl = hoverCanvasRef.current

    if (canvasEl === null || hoverCanvasEl === null || rect === null) return

    const { drawTranscriptRow, heatmap } = drawHeatmapWithBlocks(
      canvasEl,
      Array.from(clusters.values()),
      Array.from(view.selectedTranscripts),
      scDataset,
      rect)

    drawTranscriptRow(hoverCanvasEl, null)

    drawTranscriptRowRef.current = drawTranscriptRow

    setHeatmap(heatmap)

  // FIXME: add rect to effect dependencies
  }, [ canvasRef.current, view.selectedTranscripts ])

  useEffect(() => {
    const canvasEl = hoverCanvasRef.current

    if (!canvasEl) return

    const drawTranscriptRow = drawTranscriptRowRef.current

    if (!drawTranscriptRow) return

    if (heatmap && view.hoveredTranscript && heatmap.transcriptPositions.has(view.hoveredTranscript)) {
      drawTranscriptRow(canvasEl, null)
    } else {
      drawTranscriptRow(canvasEl, view.hoveredTranscript)
    }
  }, [ view.hoveredTranscript ])

  useEffect(() => {
    dispatch(viewActions.setHoveredTranscript({
      transcript: hoveredSquare && hoveredSquare.transcript,
    }))

    dispatch(viewActions.setHoveredCluster({
      cluster: hoveredSquare && hoveredSquare.cluster,
      source: 'HeatMap',
    }))
  }, [ hoveredSquare ])

  return (
    h('div', {
      ref,
      style: {
        background: 'white',
        height: '100%',
        position: 'relative',
      },
    }, ...[
      rect && h('canvas', {
        ref: canvasRef,
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
        },
        x: 0,
        y: 0,
        height: rect.height,
        width: rect.width,
      }),

      rect && h('canvas', {
        ref: hoverCanvasRef,
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
        },
        x: 0,
        y: 0,
        height: rect.height,
        width: rect.width,
      }),

      h(GridOverlayWrapper, null, ...[
        hoveredGridTranscript && (
          h('div', {
            className: 'grid-overlay-transcript',
            style: {
              position: 'absolute',
              left: hoveredGridTranscript.x - GRID_HOVER_OUTLINE_WIDTH,
              width: hoveredGridTranscript.w + 2 * GRID_HOVER_OUTLINE_WIDTH,
              top: hoveredGridTranscript.y - GRID_HOVER_OUTLINE_WIDTH,
              height: hoveredGridTranscript.h + 2 * GRID_HOVER_OUTLINE_WIDTH,
              border: `${GRID_HOVER_OUTLINE_WIDTH}px solid ${GRID_HOVER_OUTLINE_COLOR}`,
            },
          })
        ),

        hoveredGridCluster && (
          h('div', {
            className: 'grid-overlay-cluster',
            style: {
              position: 'absolute',
              left: hoveredGridCluster.x - GRID_HOVER_OUTLINE_WIDTH,
              width: hoveredGridCluster.w + 2 * GRID_HOVER_OUTLINE_WIDTH,
              top: hoveredGridCluster.y - GRID_HOVER_OUTLINE_WIDTH,
              height: hoveredGridCluster.h + 2 * GRID_HOVER_OUTLINE_WIDTH,
              border: `${GRID_HOVER_OUTLINE_WIDTH}px solid ${GRID_HOVER_OUTLINE_COLOR}`,
            },
          })
        ),

        heatmap && h('div', null, heatmap.grid.clusters.flatMap(x => x.squares).map(
          square => (
            h('div', {
              key: square.transcript + square.cluster.id,
              onMouseEnter() {
                setHoveredSquare(square)
              },
              onMouseLeave() {
                setHoveredSquare(null)
              },
              title: `${square.transcript}: ${formatNumber(square.meanZScore)}`,
              style: {
                position: 'absolute',
                top: square.y,
                left: square.x - GRID_GAP,
                width: square.w + 2 * GRID_GAP,
                height: square.h,
              },
            })
          )
        )),
      ]),
    ])
  )
}
