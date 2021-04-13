import h from 'react-hyperscript'
import * as d3 from 'd3'
import * as React from 'react'

import { PairwiseComparison } from '../../types'
import { getPlotBins, Bin } from '../../utils'

import padding from './padding'
import { PlotDimensions, useDimensions } from './hooks'

const { useState, useEffect, useRef } = React

const TRANSCRIPT_BIN_MULTIPLIERS = [
  0,
  .35,
  .5,
  .65,
  .8,
]

const GRID_SQUARE_UNIT = 8

type PlotProps = {
  loading: boolean,
  width: number;
  height: number;
  abundanceLimits: [[number, number], [number, number]];
  pairwiseData: PairwiseComparison | null;
  pValueThreshold: number;

  hoveredTranscript: string | null;
  savedTranscripts: Set<string>;

  // FIXME
  brushedArea: any;
}

function useAxes(
  svgEl: SVGSVGElement | null,
  dimensions: PlotDimensions
) {
  useEffect(() => {
    if (svgEl === null) return

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
        .attr('x1', Math.ceil(xScale(xScale.domain()[0])))
        .attr('x2', Math.ceil(xScale(xScale.domain()[1])))
        .attr('y1', Math.ceil(yScale(y)))
        .attr('y2', Math.ceil(yScale(y)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    });

    xScale.ticks().forEach(x => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(x)))
        .attr('x2', Math.ceil(xScale(x)))
        .attr('y1', Math.ceil(yScale(yScale.domain()[0])))
        .attr('y2', Math.ceil(yScale(yScale.domain()[1])))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    })
  }, [svgEl, dimensions])
}

type BinData = {
  bin: Bin;
  color: string;
  brushedColor: string;
  multiplier: number;
}

function useBins(
  svgEl: SVGSVGElement | null,
  dimensions: PlotDimensions,
  {
    loading,
    pairwiseData,
    pValueThreshold,
  } : PlotProps
) {
  const ref = useRef<d3.Selection<SVGRectElement, BinData, SVGElement, unknown>>()

  useEffect(() => {
    if (svgEl) {
      const { xScale, yScale } = dimensions

      d3.select(svgEl)
        .select('.squares > g')
        .remove()

      if (loading) return;

      if (pairwiseData === null) {
        d3.select(svgEl)
          .select('.squares')
          .append('g')
          .append('text')
          .attr('x', xScale(d3.mean(xScale.domain())!))
          .attr('y', yScale(d3.mean(yScale.domain())!))
          .text('No data available for comparison')
          .style('text-anchor', 'middle')

        return;
      }

      const bins = getPlotBins(
        pairwiseData,
        ({ pValue }) => (
          pValue !== null &&
          pValue <= pValueThreshold
        ),
        xScale,
        yScale,
        8)

      const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([-300,150])

      const brushedColorScale = d3.scaleSequential(d3.interpolatePurples)
        .domain([-500,150])

      const data = bins.map(bin => {
        const multiplier = TRANSCRIPT_BIN_MULTIPLIERS[bin.transcripts.length] || 1

        let color: string
          , brushedColor: string


        if (bin.transcripts.length === 0) {
          color = colorScale(0)
          brushedColor = colorScale(0)
        } else if (bin.transcripts.length < 5) {
          color = colorScale(5)
          brushedColor = brushedColorScale(5)
        } else if (bin.transcripts.length >= 150) {
          color = colorScale(150)
          brushedColor = brushedColorScale(150)
        } else {
          color = colorScale(bin.transcripts.length)
          brushedColor = brushedColorScale(bin.transcripts.length)
        }

        return {
          bin,
          color,
          brushedColor,
          multiplier,
        }
      })

      const binSelection = d3.select(svgEl)
        .select('.squares')
        .append('g')
        .selectAll('rect')
        .data(data.filter(b => b.bin.transcripts.length)).enter()
          .append('rect')
          .attr('x', d => d.bin.x0 + (1 - d.multiplier) / 2 * GRID_SQUARE_UNIT)
          .attr('y', d => d.bin.y1 + (1 - d.multiplier) / 2 * GRID_SQUARE_UNIT)
          .attr('width', d => GRID_SQUARE_UNIT * d.multiplier)
          .attr('height', d => GRID_SQUARE_UNIT * d.multiplier)
          .attr('fill', d => d.color)

      ref.current = binSelection

      d3.select(svgEl)
        .select('defs').selectAll('*').remove()

      d3.select(svgEl)
        .select('defs')
        .append('clipPath')
        .attr('id', 'visible-plot')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', xScale.range()[1])
        .attr('height', yScale.range()[0])

      // drawSavedTranscripts()
    }

    return () => {
      // resetSelectedBin()
    }
  }, [ svgEl, dimensions, pairwiseData, pValueThreshold ])

  return ref
}

function drawSavedTranscripts() {
}

function resetSelectedBin() {
}

function useHoveredTranscriptMarker(
  svgEl: SVGSVGElement | null,
  dimensions: PlotDimensions,
  {
    hoveredTranscript,
    pairwiseData
  }: PlotProps
) {
  useEffect(() => {
    if (svgEl === null) return

    const { xScale, yScale } = dimensions

    const container = d3.select(svgEl).select('.hovered-marker')

    container.selectAll('circle')
      .transition()
      .duration(360)
      .ease(d3.easeCubicOut)
      .style('opacity', 0)
      .remove()

    if (hoveredTranscript === null) return;
    if (pairwiseData === null) return;

    const data = pairwiseData.get(hoveredTranscript)

    if (!data) return

    const { logATA, logFC } = data

    if (logATA === null || logFC === null) return

    container.append('circle')
      .attr('cx', xScale(logATA))
      .attr('cy', yScale(logFC))
      .attr('r', 20)
      .attr('opacity', 1)
      .attr('fill', 'none')
      .attr('stroke', 'coral')
      .attr('stroke-width', 2)

    container.append('circle')
      .attr('cx', xScale(logATA))
      .attr('cy', yScale(logFC))
      .attr('opacity', 1)
      .attr('r', 3)
      .attr('fill', 'coral')
  }, [ hoveredTranscript, pairwiseData, dimensions ])
}

export default function Plot(props: PlotProps) {
  const [ transform, setTransform ] = useState<d3.ZoomTransform>(d3.zoomIdentity)
      , svgRef = useRef<SVGSVGElement>(null)
      , plotGRef = useRef<SVGGElement>(null)

  const svgEl = svgRef.current
      , plotGEl = svgRef.current

  const dimensions = useDimensions({
    abundanceLimits: props.abundanceLimits,
    height: props.height,
    width: props.width,
    transform,
  })

  useAxes(svgEl, dimensions)

  const binSelectionRef = useBins(svgEl, dimensions, props)

  useHoveredTranscriptMarker(svgEl, dimensions, props)

  return (
    h('div', [
      h('svg', {
        position: 'absolute',
        top: 0,
        bottom: 0,
        height: '100%',
        viewBox: `0 0 ${dimensions.width} ${dimensions.height}`,
        ref: svgRef,
      }, [
        h('defs', [
        ]),

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
        }, 'log₂ (Average Transcript Abundance)'),

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
        }, 'log₂ (Fold Change)'),

        h('g', {
          ref: plotGRef,
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

          h('g', { clipPath: 'url(#visible-plot)' }, [
            h('g.squares'),

            h('g.saved-transcripts'),

            h('g.interaction'),

            h('g.hovered-marker'),
          ]),
        ]),
      ])
    ])
  )
}
