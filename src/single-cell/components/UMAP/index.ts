import { createElement as h } from 'react'
import * as d3 from 'd3'
import * as React from 'react'
import * as R from 'ramda'
import styled from 'styled-components'
import throttle from 'throttleit'

import padding from '@dredge/bulk/components/MAPlot/padding'
import { useDimensions } from '@dredge/bulk/components/MAPlot/hooks'
import { useSized } from '@dredge/main'

import * as viewActions from '../../actions'
import SingleCellExpression from '../../expressions'
import { useView, useSeuratDataset, useViewDispatch } from '../../hooks'

import {
  SeuratCell,
  SeuratCellMap,
  SeuratCluster,
  SeuratClusterMap
} from '../../types'

import UMAP from './UMAP'

const { useEffect, useCallback, useMemo, useRef, useState } = React

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

      prevHoveredCluster.current = nextCluster

      onCellHover(nearestCell)
    })

  interactionLayer.on('click', (e: MouseEvent) => {
    const cluster = prevHoveredCluster.current

    onClusterClick(cluster, e)
  })
  }, [ dimensions ])
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
      , dispatch = useViewDispatch()
      , view = useView()
      , { hoveredTranscript, focusedTranscript } = view
      , svgRef = useRef<SVGSVGElement>(null)
      , dimensions = useAxes(svgRef, width, height, cells)
      , [ hoveringCluster, setHoveringCluster ] = useState(false)
      , [ hoveredCluster, setHoveredCluster ] = useState<SeuratCluster | null>(null)
      , clusterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
      , hoveredClusterRef = useRef<string | null>(null)
      , [ showTranscript, setShowTranscript ] = useState<string | null>(null)

  const throttledSetTranscript = useCallback(throttle((transcript: string | null) => {
      setShowTranscript(transcript)
  }, 150), [])

  const allCells = useMemo(() => Array.from(cells.values()), [ cells ])

  useEffect(() => {
    throttledSetTranscript(hoveredTranscript || focusedTranscript)
  }, [ hoveredTranscript, focusedTranscript ])

  useEffect(() => {
    if (view.hoveredCluster.source === 'UMAP') return

    if (clusterTimeoutRef.current) {
      clearTimeout(clusterTimeoutRef.current)
      clusterTimeoutRef.current = null
    }
    setHoveredCluster(view.hoveredCluster.cluster)
  }, [ view.hoveredCluster ])

  useInteractionLayer(
    svgRef,
    dimensions,
    cells,
    cell => {
      if (hoveredClusterRef.current === (cell?.clusterID)) return

      const cluster = cell && clusters.get(cell.clusterID)!

      setHoveringCluster(cluster !== null)

      if (cluster === null) {
        if (clusterTimeoutRef.current === null) {
          clusterTimeoutRef.current = setTimeout(() => {
            setHoveredCluster(cluster)
            hoveredClusterRef.current = cell && cell.clusterID
            dispatch(viewActions.setHoveredCluster({
              cluster,
              source: 'UMAP',
            }))
          }, 150)
        }
      } else {
        if (clusterTimeoutRef.current) {
          clearTimeout(clusterTimeoutRef.current)
          clusterTimeoutRef.current = null
        }
        setHoveredCluster(cluster)
        hoveredClusterRef.current = cell && cell.clusterID
        dispatch(viewActions.setHoveredCluster({
          cluster,
          source: 'UMAP',
        }))
      }

    },
    (cluster, e) => {
      onClusterClick(cluster, e)
    }
  )

  return (
    h(Container, null, ...[
      h(UMAP, {
        type: 'background',
        dimensions,
        cells: allCells,
        style: {
          backgroundColor: '#f9f9f9',
        },
      }),

      h(UMAP, {
        type: 'cluster-colors',
        dimensions,
        cells: allCells,
        clusters,
        style: {
          display: showTranscript === null ? undefined : 'none',
          backgroundColor: 'transparent',
        },
      }),

      showTranscript === null ? null : h(UMAP, {
        type: 'transcript-expression',
        dimensions,
        cells: allCells,
        scDataset,
        transcript: showTranscript,
        clusters,
        style: {
          backgroundColor: 'transparent',
        },
      }),

      h(UMAP, {
        type: 'focused-cluster',
        cluster: hoveredCluster,
        dimensions,
        cells: allCells,
        scDataset,
        transcript: showTranscript,
      }),

      h(UMAP, {
        type: 'cluster-labels',
        clusters,
        dimensions,
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
      }, ...[
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
        }, ...[

          h('g', {
            className: 'x-axis',
            transform: `translate(0, ${dimensions.plotHeight})`,
          }),

          h('g', { className: 'y-axis' }),

          h('g', {
            className: 'interaction-layer',
            ['data-hovering-cluster']: hoveringCluster,
          }, ...[
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
    }, ...[
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

