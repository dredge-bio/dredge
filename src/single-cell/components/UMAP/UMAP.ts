import { createElement as h } from 'react'
import * as d3 from 'd3'
import { useRef, useEffect } from 'react'

// import { distance } from '@dredge/main'
import { useDimensions } from '@dredge/bulk/components/MAPlot/hooks'
import { delay } from '@dredge/main'

import {
  SeuratCell,
  SeuratCluster,
  SeuratClusterMap
} from '../../types'

import SingleCellExpression from '../../expressions'

type UMAPPlotData = {
  cells: SeuratCell[],
  cellColor: (cell: SeuratCell) => string,
  cellRadius: (cell: SeuratCell) => number,
  dimensions: ReturnType<typeof useDimensions>,
  animationID: number,
  currentAnimationID: { current: number }
  clear?: boolean,
  canvasEl: HTMLCanvasElement
}

const CELL_DRAW_BATCH_SIZE = 1500

async function drawUMAP(data: UMAPPlotData) {
  const {
    cells,
    cellColor,
    cellRadius,
    dimensions,
    clear=false,
    canvasEl,
    animationID,
    currentAnimationID,
  } = data

  const { xScale, yScale } = dimensions
      , ctx = canvasEl.getContext('2d')!

  if (clear) {
    ctx.clearRect(0, 0, dimensions.plotWidth, dimensions.plotHeight)
  }

  let i = 0

  for (const cell of cells) {
    const { umap1, umap2 } = cell
        , x = xScale(umap1)
        , y = yScale(umap2)
        , r = cellRadius(cell)
        , fill = cellColor(cell)

    if (animationID !== currentAnimationID.current) {
      return
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, true);
    ctx.fillStyle = fill;
    ctx.closePath();
    ctx.fill();

    i++;

    if (i % CELL_DRAW_BATCH_SIZE === 0) {
      await delay(0)
    }
  }
}

function drawClusterLabel(
  cluster: SeuratCluster,
  dimensions: ReturnType<typeof useDimensions>,
  canvasEl: HTMLCanvasElement
) {
  const { xScale, yScale } = dimensions

  const ctx = canvasEl.getContext('2d')!

  ctx.font = '36px sans-serif'
  ctx.fillStyle = 'black'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  ctx.fillText(
    cluster.id,
    xScale(cluster.midpoint[0]),
    yScale(cluster.midpoint[1]))
}


/*
function drawClusterOutlines(
  cluster: SeuratCluster,
  dimensions: ReturnType<typeof useDimensions>,
  canvasEl: HTMLCanvasElement
) {
  const { xScale, yScale } = dimensions

  const ctx = canvasEl.getContext('2d')!

  cluster.cellClusters.forEach(cellCluster => {

    if (cellCluster.cells.length < 5) {
      const { midpoint } = cellCluster
          , x = xScale(midpoint[0])
          , y = yScale(midpoint[1])

      let r = d3.max(
        cellCluster.cells,
        d => distance([ x, y ], [ xScale(d.umap1), yScale(d.umap2) ]))!

      // Increase the radius by 10px of padding so that there is some space
      // between the cells and the outline
      if (r < 5) {
        r += 10
      } else {
        r += 5
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI, true);
      ctx.lineWidth = 2
      ctx.strokeStyle = 'black'
      ctx.closePath();
      ctx.save()
      ctx.globalCompositeOperation = 'xor'
      ctx.fillStyle = 'white';
      ctx.fill()
      ctx.restore()
      // ctx.stroke()
    } else {
      const { midpoint } = cellCluster
          , x0 = xScale(midpoint[0])
          , y0 = yScale(midpoint[1])

      const hull = d3.polygonHull(
        cellCluster.cells.map(d => [ xScale(d.umap1), yScale(d.umap2) ]))!

      const paddedHull = hull.map(([ x1, y1 ]) => {
        const d = distance([x0, y0], [x1, y1])
            , paddedD = d + 20

        return [
          x0 - (paddedD * (x0 - x1)) / d,
          y0 - (paddedD * (y0 - y1)) / d,
        ] as [ number, number ]
      })

      const firstPoint = paddedHull[0]!

      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.strokeStyle = 'black'
      ctx.moveTo(firstPoint[0], firstPoint[1])
      paddedHull.forEach(([ x, y ]) => {
        ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.save()
      ctx.globalCompositeOperation = 'xor'
      ctx.fillStyle = 'white';
      ctx.fill()
      ctx.restore()
      // ctx.stroke()
    }
  })
}
*/

type UMAPProps = {
  dimensions: ReturnType<typeof useDimensions>;
  style?: Partial<CSSStyleDeclaration>;
} & (
  | {
    type: 'background';
    cells: SeuratCell[];
  }
  | {
    type: 'cluster-labels';
    clusters: SeuratClusterMap;
  }
  | {
    type: 'cluster-colors';
    cells: SeuratCell[];
    clusters: SeuratClusterMap;
  }
  | {
    type: 'transcript-expression';
    cells: SeuratCell[];
    clusters: SeuratClusterMap;
    scDataset: SingleCellExpression;
    transcript: string;
  } | {
    type: 'focused-cluster';
    cluster: SeuratCluster | null;
    cells: SeuratCell[];
    scDataset: SingleCellExpression;
    transcript: string | null;
  }
)

// FIXME: Memoize this function
function sortCells(
  cells: SeuratCell[],
  transcript: string,
  scDataset: SingleCellExpression
) {
  const expressionsByCell = scDataset.getExpressionsForTranscript(transcript)

  let sortedCells = [] as SeuratCell[]
    , maxExpression = 0

  cells.forEach(cell => {
    const level = expressionsByCell.get(cell)

    if (level === undefined) return

    if (level > maxExpression) maxExpression = level

    sortedCells.push(cell)
  })

  // Sort embeddings so that they are drawn in order of transcript expression
  // level from lowest to highest
  sortedCells = sortedCells.sort((a, b) => {
    const levelA = expressionsByCell.get(a) || 0
        , levelB = expressionsByCell.get(b) || 0

    if (levelA === levelB) return 0

    return levelA > levelB
      ? 1
      : -1
  })

  const colorScale = d3.scaleLinear<string>()
    .domain([0, maxExpression])
    .range(['#ddd', 'red'])

  return {
    expressionsByCell,
    sortedCells,
    colorScale,
  }
}

export default function UMAP(props: UMAPProps) {
  const canvasRef = useRef<HTMLCanvasElement>()
      , animationID = useRef(0)
      , currentAnimationID = useRef(0)

  useEffect(() => {
    const canvasEl = canvasRef.current

    if (!canvasEl) return

    window.requestAnimationFrame(() => {
      animationID.current += 1
      currentAnimationID.current = animationID.current

      if (props.type === 'background') {
        drawUMAP({
          cells: props.cells,
          cellColor: () => '#ddd',
          cellRadius: () => 1,
          dimensions: props.dimensions,
          clear: true,
          canvasEl,
          animationID: animationID.current,
          currentAnimationID,
        })

      } else if (props.type === 'cluster-colors') {
        drawUMAP({
          cells: props.cells,
          cellColor: (d) => props.clusters.get(d.clusterID)!.color,
          cellRadius: () => 1.75,
          dimensions: props.dimensions,
          clear: true,
          canvasEl,
          animationID: animationID.current,
          currentAnimationID,
        })

        /*
        Array.from(props.clusters.values()).forEach(cluster => {
          drawClusterLabel(cluster, props.dimensions, canvasEl)
        })
        */
      } else if (props.type === 'transcript-expression') {
        const {
          expressionsByCell,
          sortedCells,
          colorScale,
        } = sortCells(
          props.cells, props.transcript, props.scDataset)


        drawUMAP({
          cells: sortedCells,
          cellColor: cell => colorScale(expressionsByCell.get(cell) || 0),
          cellRadius: cell => expressionsByCell.has(cell) ? 2.25 : 1.75,
          dimensions: props.dimensions,
          clear: true,
          canvasEl,
          animationID: animationID.current,
          currentAnimationID,
        })

        /*
        Array.from(props.clusters.values()).forEach(cluster => {
          drawClusterLabel(cluster, props.dimensions, canvasEl)
        })
        */
      } else if (props.type === 'cluster-labels') {
        Array.from(props.clusters.values()).forEach(cluster => {
          drawClusterLabel(cluster, props.dimensions, canvasEl)
        })
      } else {
        // type is 'focused-cluster'
        const { cluster, dimensions } = props
            , ctx = canvasEl.getContext('2d')!

        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)

        if (cluster === null) return

        const cells = cluster.cells

        ctx.save()
        ctx.beginPath()
        ctx.globalAlpha = .7
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvasEl.width, canvasEl.height)
        ctx.restore()

        /*
        drawClusterOutlines(cluster, dimensions, canvasEl)
        */

        if (props.transcript === null) {
          drawUMAP({
            cells,
            cellColor: () => cluster.color,
            cellRadius: () => 2,
            dimensions,
            canvasEl,
            animationID: animationID.current,
            currentAnimationID,
          })
        } else {
          const {
            expressionsByCell,
            sortedCells,
            colorScale,
          } = sortCells(
            props.cells, props.transcript, props.scDataset)


          drawUMAP({
            cells: sortedCells.filter(cell => cell.clusterID === cluster.id),
            cellColor: cell => colorScale(expressionsByCell.get(cell) || 0),
            cellRadius: cell => expressionsByCell.has(cell) ? 2.25 : 1.75,
            dimensions: props.dimensions,
            canvasEl,
            animationID: animationID.current,
            currentAnimationID,
          })
        }

        drawClusterLabel(cluster, dimensions, canvasEl)

      }
    })

  }, [
    canvasRef.current,
    props.dimensions,
    'cells' in props ? props.cells : undefined,
    'cluster' in props ? props.cluster : undefined,
    props.type,
    'transcript' in props ? props.transcript : undefined,
  ])

  return (
    h('canvas', {
      ref: canvasRef,
      x: 0,
      y: 0,
      width: props.dimensions.plotWidth,
      height: props.dimensions.plotHeight,
      style: {
        position: 'absolute',
        left: props.dimensions.padding.l,
        top: props.dimensions.padding.t,
        ...props.style,
      },
    })
  )
}
