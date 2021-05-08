import h from 'react-hyperscript'
import * as d3 from 'd3'
import * as React from 'react'

import padding from '../MAPlot/padding'
import { useDimensions } from '../MAPlot/hooks'

import SingleCellExpression from '../../single-cell'
import { SeuratCell, SeuratCellMap } from '../../projects/sc/types'
import { useProject } from '../../projects/hooks'

const { useEffect, useMemo, useRef, useState } = React

function useSeuratData() {
  const project = useProject('global', 'SingleCell')

  const ret = useMemo(() => {
    if (project.type !== 'SingleCell') {
      throw new Error()
    }

    const { transcripts, cells, expressionData } = project.data

    const scDataset = new SingleCellExpression(transcripts, [...cells.keys()], expressionData)

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

function useEmbeddingsByTranscript(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: ReturnType<typeof useDimensions>,
  cells: SeuratCellMap,
  scDataset: SingleCellExpression,
  transcriptName: string
) {
  useEffect(() => {
    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions

    const expressions = scDataset.getExpressionsForTranscript(transcriptName)

    const expressionsByCell = new Map(
      expressions.map(({ cell, expression }) => [cell, expression]))

    const colorScale = d3.scaleLinear<number, string>()
      .domain([0, d3.max(expressions, d => d.expression) || 1])
      // FIXME: I don't know how to set the range to a color without getting
      // a TS warning
      .range(['#ddd', 'red'] as unknown as [number, number])

    const canvas: d3.Selection<HTMLCanvasElement, unknown, null, undefined> = d3.select(svgEl)
      .select('canvas')

    const ctx = canvas.node()!.getContext('2d')!

    ctx.clearRect(0, 0, dimensions.plotWidth, dimensions.plotHeight)

    // Sort embeddings so that they are drawn in order of transcript expression
    // level from lowest to highest
    const sortedCells = [...cells.values()].sort((a, b) => {
      const levelA = expressionsByCell.get(a.cellID) || 0
          , levelB = expressionsByCell.get(b.cellID) || 0

      if (levelA === levelB) return 0

      return levelA > levelB
        ? 1
        : -1
    })

    sortedCells.forEach(({ cellID, umap1, umap2 }) => {
      const x = xScale(umap1)
          , y = yScale(umap2)
          , r = expressionsByCell.has(cellID) ? 1.75 : 1
          , fill = colorScale(expressionsByCell.get(cellID) || 0)

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

    const clusters: Map<number, {
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
  cells: SeuratCellMap;
  scDataset: SingleCellExpression;
}

function SingleCell(props: SingleCellProps) {
  const { cells, scDataset } = props
      , svgRef = useRef<SVGSVGElement>(null)
      , dimensions = useAxes(svgRef, 800, 800, cells)
      , [ transcript, setTranscript ] = useState('cah6')

  useEmbeddingsByTranscript(
    svgRef,
    dimensions,
    cells,
    scDataset,
    transcript
  )

  return (
    h('svg', {
      position: 'absolute',
      top: 0,
      bottom: 0,
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
        h('rect', {
          fill: '#f9f9f9',
          stroke: '#ccc',
          x: 0,
          y: 0,
          width: dimensions.plotWidth,
          height: dimensions.plotHeight,
        }),

        h('g.x-axis', {
          transform: `translate(0, ${dimensions.plotHeight})`,
        }),
        h('g.y-axis'),

        h('g', [
          h('g.umap', [
            React.createElement('foreignObject', {
              x: 0,
              y: 0,
              width: dimensions.plotWidth,
              height: dimensions.plotHeight,
            }, [
              h('div', {
                key: 'plot',
                style: {
                  margin: '0px',
                  padding: '0px',
                  backgroundColor: 'transparent',
                },
                width: dimensions.plotWidth + 'px',
                height: dimensions.plotHeight + 'px',
              }, [
                h('canvas', {
                  x: 0,
                  y: 0,
                  width: dimensions.plotWidth,
                  height: dimensions.plotHeight,
                }),
              ]),
            ]),
          ]),
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

    ])
  )
}

export default function SingleCellLoader() {
  const { cells, scDataset } = useSeuratData()

  return h(SingleCell, {
    scDataset,
    cells,
  })
}

