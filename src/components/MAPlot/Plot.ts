import h from 'react-hyperscript'
import throttle from 'throttleit'
import * as d3 from 'd3'
import * as React from 'react'

import { ViewState, DredgeConfig } from '../../types'
import { getPlotBins, Bin } from '../../utils'
import { useAppDispatch } from '../../hooks'
import { actions as viewActions, useComparedTreatmentLabels } from '../../view'

import padding from './padding'
import { PlotDimensions, useDimensions } from './hooks'
import TreatmentLabels from './TreatmentLabels'

type InteractionActions =
  'brush' |
  'zoom'

const { useState, useLayoutEffect, useEffect, useRef } = React

const TRANSCRIPT_BIN_MULTIPLIERS = [
  0,
  .35,
  .5,
  .65,
  .8,
]

const GRID_SQUARE_UNIT = 8

type Brush2D = [[number, number], [number, number]]

type PlotProps = {
  loading: boolean,
  width: number;
  height: number;
  onBrush: (extent: [number, number, number, number] | null) => void;
  persistBrush: (extent: [number, number, number, number] | null) => void;
} & Pick<ViewState,
  'pairwiseData' |
  'pValueThreshold' |
  'hoveredTranscript' |
  'savedTranscripts' |
  'displayedTranscripts' |
  'brushedArea'
> & Pick<DredgeConfig,
  'abundanceLimits'
>

function useBrush(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: PlotDimensions,
  binSelectionRef: ReturnType<typeof useBins>,
  interactionType: InteractionActions,
  {
    onBrush,
    persistBrush,
    brushedArea,
  }: PlotProps
) {
  const dispatch = useAppDispatch()
      , brushedRef = useRef(false)

  useEffect(() => {
    if (interactionType !== 'brush') return

    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions
        , [ x0, x1 ] = xScale.domain().map(xScale)
        , [ y0, y1 ] = yScale.domain().map(yScale)

    let finishedBrush = false

    const setBrush = (
      extent: [[number, number], [number, number]] | null,
      persist?: boolean
    ) => {
      if (!extent) {
        onBrush(null)
        if (persist) {
          persistBrush(null)
        }
        return
      }

      const cpmBounds = extent.map(x => x[0]).map(xScale.invert)
          , fcBounds = extent.map(x => x[1]).map(yScale.invert)

      const coords = <[number, number, number, number]> [
        cpmBounds[0],
        fcBounds[0],
        cpmBounds[1],
        fcBounds[1],
      ].map(n => n.toFixed(3)).map(parseFloat)

      onBrush(coords)

      if (persist) {
        persistBrush(coords)
      }
    }

    const throttledSetBrush = throttle((extent: [[number, number], [number, number]] | null) => {
      if (finishedBrush) return;
      setBrush(extent)
    }, 120)

    const brush = d3.brush()
      .extent([[x0, y1], [x1, y0]])
      .on('brush', (e: d3.D3BrushEvent<unknown>) => {
        if (!e.sourceEvent) return
        if (!e.selection) return

        const extent = e.selection as Brush2D

        throttledSetBrush(extent)
      })
      .on('start', () => {
        const binSelection = binSelectionRef.current

        finishedBrush = false

        if (binSelection) {
          binSelection
            .attr('stroke', 'none')
            .attr('class', '')
        }

        dispatch(viewActions.setHoveredBinTranscripts(null))
        dispatch(viewActions.setSelectedBinTranscripts(null))
      })
      .on('end', (e: d3.D3BrushEvent<unknown>) => {
        finishedBrush = true

        const binSelection = binSelectionRef.current

        if (!e.sourceEvent) return
        if (!binSelection) return

        // Reset each bin to its original fill
        // FIXME: do we even color brushed bins anymore? If not, this can be
        // taken out.
        binSelection.attr('fill', d => d.color)

        if (!e.selection) {
          brushedRef.current = false

          setBrush(null, true)
          return
        }

        brushedRef.current = true
        setBrush(e.selection as Brush2D, true)
      })

    const brushSel = d3.select(svgEl)
      .select('.interaction')
      .append('g')

    brushSel.call(brush)

    if (brushedArea) {
      const [ x0, y0, x1, y1 ] = brushedArea

      brush.move(brushSel, [
        [xScale(x0), yScale(y0)],
        [xScale(x1), yScale(y1)],
      ])
    }

    return () => {
      brushSel.call(brush.move, null)
    }
  }, [ interactionType ])


  return brushedRef
}

function useAxes(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: PlotDimensions
) {
  useLayoutEffect(() => {
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
  }, [dimensions])
}

type BinData = {
  bin: Bin;
  color: string;
  brushedColor: string;
  multiplier: number;
}

function useBins(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: PlotDimensions,
  {
    loading,
    pairwiseData,
    pValueThreshold,
  } : PlotProps
) {
  const ref = useRef<d3.Selection<SVGRectElement, BinData, SVGElement, unknown>>()

  useLayoutEffect(() => {
    if (loading) return;

    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions

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
    } else {
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
    }

    return () => {
      d3.select(svgEl)
        .select('.squares > g')
        .remove()
    }
  }, [ dimensions, pairwiseData, pValueThreshold ])

  return ref
}

function useWatchedTranscripts(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: PlotDimensions,
  {
    savedTranscripts,
    pairwiseData,
  }: PlotProps
) {
  useLayoutEffect(() => {
    if (!pairwiseData) return

    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions

    d3.select(svgEl)
      .select('.saved-transcripts')
      .selectAll('circle')
      .data([...savedTranscripts].filter(x => pairwiseData.has(x)))
          .enter()
        .append('circle')
        // The pairwise data is guaranteed to have the transcript in it
        // because of the filter above. I'm pretty sure this means that
        // logATA and logFC are guaranteed to exist as well, but I can't
        // quite recall right now. so.... TODO
        .attr('cx', d => xScale(pairwiseData.get(d)!.logATA!))
        .attr('cy', d => yScale(pairwiseData.get(d)!.logFC!))
        .attr('r', 2)
        .attr('fill', 'red')

    return () => {
      d3.select(svgEl)
        .select('.saved-transcripts')
        .selectAll('circle')
          .remove()
    }
  }, [ dimensions, pairwiseData, savedTranscripts ])
}

function useHoveredTranscriptMarker(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: PlotDimensions,
  {
    hoveredTranscript,
    pairwiseData,
  }: PlotProps
) {
  useLayoutEffect(() => {
    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions
        , container = d3.select(svgEl).select('.hovered-marker')

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

  return () => {
    container.selectAll('circle')
      .transition()
      .duration(360)
      .ease(d3.easeCubicOut)
      .style('opacity', 0)
      .remove()
    }
  }, [ hoveredTranscript, pairwiseData, dimensions ])
}

export default function Plot(props: PlotProps) {
  const [ transform, setTransform ] = useState<d3.ZoomTransform>(d3.zoomIdentity)
      , [ interactionType, setInteractionType ] = useState<InteractionActions>('brush')
      , svgRef = useRef<SVGSVGElement>(null)
      , plotGRef = useRef<SVGGElement>(null)

  const dimensions = useDimensions({
    abundanceLimits: props.abundanceLimits,
    height: props.height,
    width: props.width,
    transform,
  })

  useAxes(svgRef, dimensions)

  const binSelectionRef = useBins(svgRef, dimensions, props)

  useHoveredTranscriptMarker(svgRef, dimensions, props)
  useWatchedTranscripts(svgRef, dimensions, props)

  const brushRef = useBrush(svgRef, dimensions, binSelectionRef, interactionType, props)

  const [ treatmentALabel, treatmentBLabel ] = useComparedTreatmentLabels()

  return (
    h('div', [
      h(TreatmentLabels, {
      }, [
        h('div', {
          /*
          onMouseLeave() {
            dispatch(Action.SetHoveredTreatment(null))
          },
          onMouseEnter() {
            dispatch(Action.SetHoveredTreatment(treatmentA))
          },
          */
        }, treatmentALabel),
        h('span', {
        }, 'vs.'),
        h('div', {
          /*
          onMouseLeave() {
            dispatch(Action.SetHoveredTreatment(null))
          },
          onMouseEnter() {
            dispatch(Action.SetHoveredTreatment(treatmentB))
          },
          */
        }, treatmentBLabel),
      ]),

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
      ]),
    ])
  )
}
