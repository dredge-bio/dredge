import h from 'react-hyperscript'
import * as d3 from 'd3'
import * as React from 'react'
import throttle from 'throttleit'

import padding from '../MAPlot/padding'
import { useDimensions } from '../MAPlot/hooks'

import SingleCellExpression from '../../single-cell'
import { SeuratCell, SeuratCellMap } from '../../projects/sc/types'
import { useProject } from '../../projects/hooks'
import { useSized } from '../../hooks'

const { useEffect, useMemo, useRef, useState } = React

function useSeuratData() {
  const project = useProject('global', 'SingleCell')

  const ret = useMemo(() => {
    if (project.type !== 'SingleCell') {
      throw new Error()
    }

    const { transcripts, cells, expressionData } = project.data

    const scDataset = new SingleCellExpression(project.data)

    return {
      scDataset,
      transcripts,
      cells,
      expressionData,
    }
  }, [project])

  return ret
}


function useAxes(
  svgRef: React.RefObject<SVGSVGElement>,
  width: number,
  height: number,
  cells: SeuratCellMap,
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
  onBrush: (clusters: Set<string> | null) => void,
) {
  useEffect(() => {
    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions
        , [ x0, x1 ] = xScale.domain().map(xScale)
        , [ y0, y1 ] = yScale.domain().map(yScale)

    const tree = d3.quadtree([...cells.values()], d => d.umap1, d => d.umap2)

    const brush = d3.brush()
      .extent([[x0!, y1!], [x1!, y0!]])
      .on('end', (e: d3.D3BrushEvent<unknown>) => {
        if (!e.sourceEvent) return

        if (!e.selection) {
          onBrush(null)
          return
        }

        const extent = e.selection as [[number, number], [number, number]]
            , [ umap1Min, umap1Max ] = extent.map(x => x[0]).map(xScale.invert) as [ number, number ]
            , [ umap2Max, umap2Min ] = extent.map(x => x[1]).map(yScale.invert) as [ number, number ]
            , brushedClusters: Set<string> = new Set()

        tree.visit((node, xMin, yMin, xMax, yMax) => {
          if (node.length === undefined) {
            let curNode = node

            while (true) {
              const cell = curNode.data

              const inRect = (
                cell.umap1 >= umap1Min &&
                cell.umap1 <= umap1Max &&
                cell.umap2 >= umap2Min &&
                cell.umap2 <= umap2Max
              )

              if (inRect) {
                brushedClusters.add(cell.clusterID)
              }

              if (node.next) {
                curNode = node.next
              } else {
                break;
              }
            }
          }

          const stopTraversing = (
            xMin > umap1Max ||
            xMax < umap1Min ||
            yMin > umap2Max ||
            yMax < umap2Min
          )

          return stopTraversing
        })

        onBrush(brushedClusters)
      })

    const brushSel = d3.select(svgEl)
      .select('.interaction-layer')
      .append('g')

    brushSel.call(brush)



    const interactionLayer = d3.select(svgEl)
      .select('.interaction-layer rect')

    interactionLayer.on('mousemove', throttle((e: MouseEvent) => {
      const [ x, y ] = d3.pointer(e)
          , { xScale, yScale } = dimensions

      const umap1 = xScale.invert(x)
          , umap2 = yScale.invert(y)
          , nearestCell = tree.find(umap1, umap2, .5)

      onCellHover(nearestCell || null)
    }, 20))
  }, [dimensions])
}


function useEmbeddingsByTranscript(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  dimensions: ReturnType<typeof useDimensions>,
  cells: SeuratCellMap,
  scDataset: SingleCellExpression,
  transcriptName: string,
) {
  useEffect(() => {
    const canvasEl = canvasRef.current!
        , { xScale, yScale } = dimensions

    const expressionsByCell = scDataset.getExpressionsForTranscript(transcriptName)

    const colorScale = d3.scaleLinear<number, string>()
      .domain([0, d3.max(expressionsByCell.values()) || 1])
      // FIXME: I don't know how to set the range to a color without getting
      // a TS warning
      .range(['#ddd', 'red'] as unknown as [number, number])

    const ctx = canvasEl.getContext('2d')!

    ctx.clearRect(0, 0, dimensions.plotWidth, dimensions.plotHeight)

    // Sort embeddings so that they are drawn in order of transcript expression
    // level from lowest to highest
    const sortedCells = [...cells.values()].sort((a, b) => {
      const levelA = expressionsByCell.get(a) || 0
          , levelB = expressionsByCell.get(b) || 0

      if (levelA === levelB) return 0

      return levelA > levelB
        ? 1
        : -1
    })

    sortedCells.forEach(cell => {
      const { umap1, umap2 } = cell
          , x = xScale(umap1)
          , y = yScale(umap2)
          , r = expressionsByCell.has(cell) ? 1.75 : 1
          , fill = colorScale(expressionsByCell.get(cell) || 0)

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI, true);
      ctx.fillStyle = fill;
      ctx.closePath();
      ctx.fill();
    })
  })
}

function useEmbeddings(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: ReturnType<typeof useDimensions>,
  cells: SeuratCellMap,
) {
  useEffect(() => {
    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions

    const clusters: Map<string, {
      cells: SeuratCell[],
      points: [number, number ][],
    }> = new Map()

    cells.forEach(val => {
      const { clusterID, cellID } = val

      if (!clusters.has(clusterID)) {
        clusters.set(clusterID, {
          cells: [],
          points: [],
        })
      }

      const cell = cells.get(cellID)!
          , point = [xScale(cell.umap1), yScale(cell.umap2)] as [number, number]

      const cluster = clusters.get(clusterID)!

      cluster.cells.push(cell)
      cluster.points.push(point)
    })

    const clusterColor = d3.scaleOrdinal(d3.schemePaired)
      .domain([...clusters.keys()].map(x => x.toString()))

    clusters.forEach((cluster, i) => {
      /*
      const hull = d3.polygonHull(cluster.points)

      if (!hull) return

      const path = `M${hull.join("L")}Z`

      d3.select(svgEl)
        .select('g.umap')
        .append('path')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        */

      d3.select(svgEl)
        .select('g.umap')
        .append('g')
        .selectAll('circle')
        .data(cluster.cells).enter()
          .append('circle')
          .attr('r', 1)
          .attr('cx', d => xScale(d.umap1))
          .attr('cy', d => yScale(d.umap2))
          .attr('fill', clusterColor(i.toString()))
          .attr('stroke', 'none')
    })

    /*

    d3.select(svgEl)
      .select('g.umap')
      .append('g')
      .selectAll('circle')
      .data(embeddings).enter()
        .append('circle')
        .attr('r', 1)
        .attr('cx', d => xScale(d.umap1))
        .attr('cy', d => yScale(d.umap2))
        .attr('fill', '#666')
        .attr('stroke', 'none')
        */

  }, [cells])
}

type SingleCellProps = {
  height: number,
  width: number,
  cells: SeuratCellMap;
  scDataset: SingleCellExpression;
  onBrushClusters: (clusters: Set<string> | null) => void;
}

function SingleCell(props: SingleCellProps) {
  const { cells, scDataset, width, height, onBrushClusters } = props
      , svgRef = useRef<SVGSVGElement>(null)
      , canvasRef = useRef<HTMLCanvasElement>(null)
      , dimensions = useAxes(svgRef, width, height, cells)
      , [ transcript, setTranscript ] = useState('cah6')
      , [ hoveredCell, setHoveredCell ] = useState<SeuratCell | null>(null)

  useEmbeddingsByTranscript(
    canvasRef,
    dimensions,
    cells,
    scDataset,
    transcript,
  )

  useInteractionLayer(
    svgRef,
    dimensions,
    cells,
    setHoveredCell,
    onBrushClusters,
  )

  return (
    h('div', {
      style: {
        position: 'relative',
      },
    }, [
      h('canvas', {
        ref: canvasRef,
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

          h('g.interaction-layer', [
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
        h('text', {
          dx: 0,
          dy: padding.t / 2,
          x: dimensions.width / 2,
          y: 0,
          style: {
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'central',
          },
        }, transcript),

      ]),
    ])
  )
}

type OuterProps = {
  onBrushClusters: (clusters: Set<string> | null) => void
}

export default function SingleCellLoader(props: OuterProps) {
  const { onBrushClusters } = props
      , { cells, scDataset } = useSeuratData()
      , [ ref, rect ] = useSized()

  return (
    h('div', {
      ref,
      style: {
        height: '100%',
      }
    }, [
      rect && h(SingleCell, {
        onBrushClusters,
        scDataset,
        cells,
        height: rect.height,
        width: rect.width,
      })
    ])
  )
}

