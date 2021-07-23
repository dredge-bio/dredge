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

const showClusters = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
]

function drawHeatmapWithLines(
  canvasEl: HTMLCanvasElement,
  clusters: SeuratClusterMap,
  scDataset: ReturnType<typeof useSeuratDataset>,
  rect: { width: number, height: number }
) {
    let cellCount: number = 0

    const zScoresByTranscript = new Map(transcripts.map(transcript => {
      const zScoresForTranscript = scDataset.getScaledCountsForTranscript(transcript)

      const clusterMap: Map<string, number[]> = new Map(
        showClusters.map(cluster => [ cluster, [] ]))

      zScoresForTranscript.forEach((zScore, cell) => {
        if (!clusterMap.has(cell.clusterID)) return
        clusterMap.get(cell.clusterID)!.push(zScore)
        cellCount += 1
      })

      return [ transcript, clusterMap ]
    }))

    cellCount = cellCount / transcripts.length

    const ctx = canvasEl.getContext('2d')!

    const colorScale = d3.scaleLinear<string>()
      .domain([ -.75, 1, 2.5 ])
      .range([ '#ff00ff', 'black', 'yellow' ])
      .clamp(true)

    const w = (rect.width - 32) / cellCount
        , h = 200 / transcripts.length

    // ctx.scale(.1, .1)
    let prevClusterStart = 16
      , clustersDrawn = false


    Array.from(zScoresByTranscript).forEach(([ transcript, zScoresByCluster ], transcriptIdx) => {
      let idx = 0

      if (transcriptIdx > 0) {
        clustersDrawn = true
      }

      Array.from(zScoresByCluster).forEach(([ clusterID, zScoresByCell ], clusterIdx) => {
        if (!clustersDrawn) {
          const cluster = clusters.get(clusterID)!
              , clusterStart = prevClusterStart
              , clusterWidth = zScoresByCell.length * w

          ctx.fillStyle = cluster.color
          ctx.fillRect(clusterStart, 80, clusterWidth, 16)
          prevClusterStart += clusterWidth

          ctx.fillStyle = 'black'
          ctx.textAlign = 'center'
          ctx.font = '24px sans-serif'
          ctx.fillText(cluster.label, clusterStart + clusterWidth / 2, 64, clusterWidth)
        }

        Array.from(zScoresByCell).forEach((zScore, cellIdx) => {
          ctx.fillStyle = colorScale(zScore)
          ctx.fillRect(16 + idx * w, 100 + transcriptIdx * h, w, h)
          /*
          debugger;
          if (zScore === curZScore) {
            consecZScores += 1
          } else {
            if (curZScore !== null) {
              ctx.fillStyle = colorScale(curZScore)
              ctx.fillRect(curZScoreStart * w, transcriptIdx * h, w * consecZScores, h)
            }

            curZScore = zScore
            curZScoreStart = idx
            consecZScores = 1
          }
          */
          idx += 1
        })
      })
    })

    colorScale.ticks(1000).forEach((num, i) => {
      ctx.fillStyle = colorScale(num)
      ctx.fillRect(16 + i * .3235, 100 + (transcripts.length + 2) * h, .3235, h)
    })
}

function drawHeatmapWithBlocks(
  canvasEl: HTMLCanvasElement,
  clusters: SeuratClusterMap,
  scDataset: ReturnType<typeof useSeuratDataset>,
  rect: { width: number, height: number }
) {
    let cellCount: number = 0

    const zScoresByTranscript = new Map(transcripts.map(transcript => {
      const zScoresForTranscript = scDataset.getScaledCountsForTranscript(transcript)

      const clusterMap: Map<string, number[]> = new Map(
        showClusters.map(cluster => [ cluster, [] ]))

      zScoresForTranscript.forEach((zScore, cell) => {
        if (!clusterMap.has(cell.clusterID)) return
        clusterMap.get(cell.clusterID)!.push(zScore)
        cellCount += 1
      })

      return [ transcript, clusterMap ]
    }))

    cellCount = cellCount / transcripts.length

    const { width, height } = rect

    const ctx = canvasEl.getContext('2d')!

    const colorScale = d3.scaleLinear<string>()
      .domain([ -1, 1, 2 ])
      .range([ '#ff00ff', 'black', 'yellow' ])
      .clamp(true)

    const PADDING_LEFT = 160
        , PADDING_RIGHT = 16


    const w = (rect.width - PADDING_LEFT - PADDING_RIGHT) / showClusters.length
        , h = 200 / transcripts.length

    // ctx.scale(.1, .1)
    let prevClusterStart = PADDING_LEFT
      , clustersDrawn = false

    Array.from(zScoresByTranscript).forEach(([ transcript, zScoresByCluster ], transcriptIdx) => {
      let idx = 0

      if (transcriptIdx > 0) {
        clustersDrawn = true
      }

      ctx.fillStyle = 'black'
      ctx.textAlign = 'end'
      ctx.textBaseline = 'middle'
      ctx.font = '24px sans-serif'
      ctx.fillText(transcript, PADDING_LEFT - 8, 100 + transcriptIdx * h + h / 2)

      Array.from(zScoresByCluster).forEach(([ clusterID, zScoresByCell ], clusterIdx) => {
        if (!clustersDrawn) {
          const cluster = clusters.get(clusterID)!
              , clusterStart = prevClusterStart
              , clusterWidth = w

          ctx.fillStyle = cluster.color
          ctx.fillRect(clusterStart, 80, clusterWidth, 16)
          prevClusterStart += clusterWidth

          ctx.fillStyle = 'black'
          ctx.textBaseline = 'alphabetic'
          ctx.textAlign = 'center'
          ctx.font = '24px sans-serif'
          ctx.fillText(cluster.label, clusterStart + clusterWidth / 2, 64, clusterWidth)
        }

        const meanZScore = d3.mean(zScoresByCell)!
        ctx.fillStyle = colorScale(meanZScore)
        ctx.fillRect(PADDING_LEFT + clusterIdx * w, 100 + transcriptIdx * h, w, h)

        Array.from(zScoresByCell).forEach((zScore, cellIdx) => {
          // ctx.fillStyle = colorScale(zScore)
          // ctx.fillRect(16 + idx * w, 100 + transcriptIdx * h, w, h)
          /*
          debugger;
          if (zScore === curZScore) {
            consecZScores += 1
          } else {
            if (curZScore !== null) {
              ctx.fillStyle = colorScale(curZScore)
              ctx.fillRect(curZScoreStart * w, transcriptIdx * h, w * consecZScores, h)
            }

            curZScore = zScore
            curZScoreStart = idx
            consecZScores = 1
          }
          */
          idx += 1
        })
      })
    })

    colorScale.ticks(300).forEach((num, i) => {
      ctx.fillStyle = colorScale(num)
      ctx.fillRect(PADDING_LEFT + i, 32 + (transcripts.length + 2) * h, 1, h)
    })

    const legendTicks = [0, 1, 2]
        , tickScale = d3.scaleLinear().range([PADDING_LEFT, PADDING_LEFT + 300]).domain([-1, 2])

    legendTicks.forEach(val => {
      ctx.fillStyle = 'black'
      ctx.font = '24px sans-serif'
      ctx.fillText(val.toString(), tickScale(val), 132 + (transcripts.length + 2) * h)
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
