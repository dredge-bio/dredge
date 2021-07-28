import h from 'react-hyperscript'
import * as d3 from 'd3'
import * as React from 'react'
import * as R from 'ramda'
import styled from 'styled-components'
import throttle from 'throttleit'

import padding from '@dredge/bulk/components/MAPlot/padding'
import { useDimensions } from '@dredge/bulk/components/MAPlot/hooks'
import { useSized, distance } from '@dredge/main'

import * as viewActions from '../actions'
import SingleCellExpression from '../expressions'
import { useView, useSeuratDataset, useViewDispatch } from '../hooks'

import {
  SeuratCell,
  SeuratCellMap,
  SeuratClusterMap,
  SeuratCluster
} from '../types'

const { useEffect, useCallback, useMemo, useRef, useState } = React

function drawUMAP(
  cells: SeuratCell[],
  color: (cell: SeuratCell) => string,
  radius: (cell: SeuratCell) => number,
  dimensions: ReturnType<typeof useDimensions>,
  canvasEl: HTMLCanvasElement
) {
  const { xScale, yScale } = dimensions
      , ctx = canvasEl.getContext('2d')!

  ctx.clearRect(0, 0, dimensions.plotWidth, dimensions.plotHeight)

  cells.forEach(cell => {
    const { umap1, umap2 } = cell
        , x = xScale(umap1)
        , y = yScale(umap2)
        , r = radius(cell)
        , fill = color(cell)

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, true);
    ctx.fillStyle = fill;
    ctx.closePath();
    ctx.fill();
  })
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
    cluster.label,
    xScale(cluster.midpoint[0]),
    yScale(cluster.midpoint[1]))
}


function useAxes(
  svgRef: React.RefObject<SVGSVGElement>,
  width: number,
  height: number,
  cells: SeuratCellMap
) {
  const umap1Extent = useMemo(
    () => d3.extent(cells.values(), x => x.umap1) as [number, number],
    [cells])

  const umap2Extent = useMemo(
    () => d3.extent(cells.values(), x => x.umap2) as [number, number],
    [cells])

  const dimensions = useDimensions({
    height,
    width,
    transform: d3.zoomIdentity,
    xDomain: umap1Extent,
    yDomain: umap2Extent,
  })

  dimensions.xScale = dimensions.xScale.nice()
  dimensions.yScale = dimensions.yScale.nice()

  useEffect(() => {
    const svgEl = svgRef.current

    const { xScale, yScale } = dimensions

    const xEl = d3.select(svgEl)
      .select<SVGGElement>('.x-axis')

    xEl.selectAll('*').remove()

    xEl.call(d3.axisBottom(xScale))

    const yEl = d3.select(svgEl)
      .select<SVGGElement>('.y-axis')

    yEl.selectAll('*').remove()

    yEl.call(d3.axisLeft(yScale));

    yScale.ticks().forEach(y => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(xScale.domain()[0]!)))
        .attr('x2', Math.ceil(xScale(xScale.domain()[1]!)))
        .attr('y1', Math.ceil(yScale(y)))
        .attr('y2', Math.ceil(yScale(y)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    });

    xScale.ticks().forEach(x => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(x)))
        .attr('x2', Math.ceil(xScale(x)))
        .attr('y1', Math.ceil(yScale(yScale.domain()[0]!)))
        .attr('y2', Math.ceil(yScale(yScale.domain()[1]!)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    })
  }, [dimensions])

  return dimensions
}

function useInteractionLayer(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: ReturnType<typeof useDimensions>,
  cells: SeuratCellMap,
  onCellHover: (cell: SeuratCell | null) => void,
  onClusterClick: (cluster: string | null, e: MouseEvent) => void
) {
  const prevHoveredCluster = useRef<string | null>(null)
      , dispatch = useViewDispatch()
      , { project } = useView()

  useEffect(() => {
    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions

    const tree = d3.quadtree([...cells.values()], d => d.umap1, d => d.umap2)

    const interactionLayer = d3.select(svgEl)
      .select('.interaction-layer rect')

    interactionLayer.on('mousemove', (e: MouseEvent) => {
      const [ x, y ] = d3.pointer(e)
          , umap1 = xScale.invert(x)
          , umap2 = yScale.invert(y)

      const nearestCell = findNearestCell(
        dimensions,
        tree,
        prevHoveredCluster.current,
        umap1,
        umap2)

      let nextCluster = null

      if (nearestCell) {
        nextCluster = nearestCell.clusterID
      }

      if (prevHoveredCluster.current !== nextCluster) {
        dispatch(viewActions.setHoveredCluster({
          cluster: nextCluster === null ? null : project.data.clusters.get(nextCluster)!,
        }))
      }

      prevHoveredCluster.current = nextCluster

      onCellHover(nearestCell)
    })

  interactionLayer.on('click', (e: MouseEvent) => {
    const cluster = prevHoveredCluster.current

    onClusterClick(cluster, e)
  })
  }, [ dimensions ])
}


function useEmbeddingsByTranscript(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  dimensions: ReturnType<typeof useDimensions>,
  cells: SeuratCellMap,
  clusters: SeuratClusterMap,
  scDataset: SingleCellExpression,
  transcript: string | null
) {
  useEffect(() => {
    const canvasEl = canvasRef.current!

    window.requestAnimationFrame(() => {
      if (transcript !== null) {
        const expressionsByCell = scDataset.getExpressionsForTranscript(transcript)


        let sortedCells = [] as SeuratCell[]
          , maxExpression = 0

        cells.forEach(cell => {
          const level = expressionsByCell.get(cell)

          if (level === undefined) return

          if (level > maxExpression) maxExpression = level

          sortedCells.push(cell)
        })

        const colorScale = d3.scaleLinear<string>()
          .domain([0, maxExpression])
          .range(['#ddd', 'red'])

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

        drawUMAP(
          sortedCells,
          cell => colorScale(expressionsByCell.get(cell) || 0),
          cell => expressionsByCell.has(cell) ? 2.25 : 1.75,
          dimensions,
          canvasEl)
      } else {
        drawUMAP(
          [...cells.values()],
          cell => clusters.get(cell.clusterID)!.color,
          () => 1.75,
          dimensions,
          canvasEl)
      }

      for (const cluster of clusters.values()) {
        drawClusterLabel(
          cluster,
          dimensions,
          canvasEl)
      }
    })

  }, [ dimensions, cells, transcript ])
}

type SingleCellProps = {
  height: number,
  width: number,
  cells: SeuratCellMap;
  clusters: SeuratClusterMap;
  scDataset: SingleCellExpression;
  onClusterClick: (cluster: string | null, e: MouseEvent) => void;
}

function findNearestCell(
  dimensions: ReturnType<typeof useDimensions>,
  tree: d3.Quadtree<SeuratCell>,
  prevCluster: string | null,
  umap1: number,
  umap2: number
) {
  const { xScale, yScale } = dimensions
      , xTick = (xScale.domain()[1]! - xScale.domain()[0]!) / 200
      , yTick = (yScale.domain()[1]! - yScale.domain()[0]!) / 200

  const points: [[number, number], number][] = [
    [[umap1, umap2], 3],
    [[umap1 + xTick, umap2], 2],
    [[umap1 - xTick, umap2], 2],
    [[umap1, umap2 + yTick], 2],
    [[umap1, umap2 - yTick], 2],
    [[umap1 + xTick * 2, umap2], 1],
    [[umap1 - xTick * 2, umap2], 1],
    [[umap1, umap2 + yTick * 2], 1],
    [[umap1, umap2 - yTick * 2], 1],
  ]

  const nearestCellCount: Map<SeuratCell, number> = new Map()
      , nearestClusterCount: Map<string, number> = new Map()

  points.forEach(([[ x, y ], weight]) => {
    const nearestCell = tree.find(x, y, .2)

    if (!nearestCell) return

    const prevCellCount = nearestCellCount.get(nearestCell) || 0
        , prevClusterCount = nearestClusterCount.get(nearestCell.clusterID) || 0

    nearestCellCount.set(nearestCell, prevCellCount + weight)
    nearestClusterCount.set(nearestCell.clusterID, prevClusterCount + weight)
  })

  // Don't change the cluster if any of the candidates are from the one
  // that's already hovered

  let consensusNearestCluster: string | null = null

  if (prevCluster && nearestClusterCount.has(prevCluster)) {
    consensusNearestCluster = prevCluster
  } else {
    consensusNearestCluster = R.head(R.sortBy(
      cluster => nearestClusterCount.get(cluster)!,
      [...nearestClusterCount.keys()])) || null
  }

  if (consensusNearestCluster) {
    const nearbyInCluster = [...nearestCellCount.keys()]
      .filter(cell => cell.clusterID === consensusNearestCluster)

    const consensusNearest = R.head(R.sortBy(
      cell => nearestCellCount.get(cell)!,
      nearbyInCluster
    ))

    return consensusNearest || null
  } else {
    return null
  }
}

const Container = styled.div`
  position: relative;

  & g[data-hovering-cluster="true"] :hover {
    cursor: pointer;
  }
`


function SingleCell(props: SingleCellProps) {
  const { cells, clusters, scDataset, width, height, onClusterClick } = props
      , view = useView()
      , { hoveredTranscript, focusedTranscript } = view
      , svgRef = useRef<SVGSVGElement>(null)
      , canvasRef = useRef<HTMLCanvasElement>(null)
      , bgCanvasRef = useRef<HTMLCanvasElement>(null)
      , overlayCanvasRef = useRef<HTMLCanvasElement>(null)
      , dimensions = useAxes(svgRef, width, height, cells)
      , [ hoveredCell, setHoveredCell ] = useState<SeuratCell | null>(null)
      , hoveredCluster = useRef<string | null>(null)
      , [ showTranscript, setShowTranscript ] = useState<string | null>(null)

  const throttledSetTranscript = useCallback(throttle((transcript: string | null) => {
      setShowTranscript(transcript)
  }, 150), [])

  useEffect(() => {
    if (bgCanvasRef.current === null) return

    drawUMAP(
      [...cells.values()],
      () => '#ddd',
      () => 1,
      dimensions,
      bgCanvasRef.current)
  }, [ bgCanvasRef.current ])

  useEffect(() => {
    throttledSetTranscript(hoveredTranscript || focusedTranscript)
  }, [ hoveredTranscript, focusedTranscript ])

  useEmbeddingsByTranscript(
    canvasRef,
    dimensions,
    cells,
    clusters,
    scDataset,
    showTranscript
  )

  useInteractionLayer(
    svgRef,
    dimensions,
    cells,
    cell => {
      const canvasEl = overlayCanvasRef.current

      if (!canvasEl) return
      if (hoveredCluster.current === (cell && cell.clusterID)) return

      setHoveredCell(cell)

      let drawCells: SeuratCell[]

      if (cell === null) {
        drawCells = []
      } else {
        drawCells = clusters.get(cell.clusterID)!.cells
      }

      drawUMAP(
        drawCells,
        () => 'limegreen',
        () => 2,
        dimensions,
        canvasEl)

      if (cell) {
        drawClusterLabel(
          clusters.get(cell.clusterID)!,
          dimensions,
          canvasEl)

        const { xScale, yScale } = dimensions
            , ctx = canvasEl.getContext('2d')!
            , cluster = clusters.get(cell.clusterID)!

        cluster.cellClusters.forEach(cellCluster => {
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
          ctx.strokeStyle = '2px black'
          ctx.fillStyle = 'transparent';
          ctx.closePath();
          ctx.stroke()
        })

      }

      hoveredCluster.current = cell && cell.clusterID
    },
    (cluster, e) => {
      onClusterClick(cluster, e)
    }
  )

  return (
    h(Container, [
      h('canvas', {
        ref: bgCanvasRef,
        style: {
          position: 'absolute',
          left: padding.l,
          top: padding.t,
          backgroundColor: '#f9f9f9',
        },
        x: 0,
        y: 0,
        width: dimensions.plotWidth,
        height: dimensions.plotHeight,
      }),

      h('canvas', {
        ref: canvasRef,
        style: {
          position: 'absolute',
          left: padding.l,
          top: padding.t,
          backgroundColor: 'transparent',
        },
        x: 0,
        y: 0,
        width: dimensions.plotWidth,
        height: dimensions.plotHeight,
      }),

      h('canvas', {
        ref: overlayCanvasRef,
        style: {
          position: 'absolute',
          left: padding.l,
          top: padding.t,
          backgroundColor: 'transparent',
        },
        x: 0,
        y: 0,
        width: dimensions.plotWidth,
        height: dimensions.plotHeight,
      }),

      h('svg', {
        style: {
          position: 'absolute',
          top: 0,
          bottom: 0,
        },
        height: dimensions.height,
        width: dimensions.width,
        viewBox: `0 0 ${dimensions.width} ${dimensions.height}`,
        ref: svgRef,
      }, [
        // X Axis label
        h('text', {
          dx: padding.l,
          dy: padding.t,
          x: dimensions.plotWidth / 2,
          y: dimensions.plotHeight + (dimensions.padding.b / 2) + 6, // extra pixels to bump it down from axis
          style: {
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'central',
          },
        }, 'UMAP_1'),

        // Y Axis label
        h('text', {
          x: 0,
          y: (dimensions.plotHeight / 2) + dimensions.padding.t,
          transform: `
            rotate(-90, 0, ${dimensions.plotHeight / 2 + dimensions.padding.t})
            translate(0, ${dimensions.padding.l / 2 - 6})
          `,
          style: {
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'central',
          },
        }, 'UMAP_2'),

        h('g', {
          transform: `translate(${padding.l}, ${padding.t})`,
        }, [

          h('g.x-axis', {
            transform: `translate(0, ${dimensions.plotHeight})`,
          }),
          h('g.y-axis'),

          h('g.interaction-layer', {
            ['data-hovering-cluster']: !!hoveredCell,
          }, [
             h('rect', {
               fill: 'transparent',
                x: 0,
                y: 0,
                width: dimensions.plotWidth,
                height: dimensions.plotHeight,
             }),
          ]),
        ]),

        // Transcript label
        (showTranscript) && h('text', {
          dx: 0,
          dy: padding.t / 2,
          x: dimensions.width / 2,
          y: 0,
          style: {
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'central',
          },
        }, showTranscript),

      ]),
    ])
  )
}

type OuterProps = {
  onClusterClick: (cluster: string | null, e: MouseEvent) => void
}

export default function SingleCellLoader(props: OuterProps) {
  const { onClusterClick } = props
      , { cells, clusters } = useView().project.data
      , scDataset = useSeuratDataset()
      , [ ref, rect ] = useSized()

  return (
    h('div', {
      ref,
      style: {
        height: '100%',
      },
    }, [
      rect && h(SingleCell, {
        onClusterClick,
        scDataset,
        cells,
        clusters,
        height: rect.height,
        width: rect.width,
      }),
    ])
  )
}

