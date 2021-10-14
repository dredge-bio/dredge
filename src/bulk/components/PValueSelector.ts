import { createElement as h } from 'react'
import styled from 'styled-components'
import * as React from 'react'
import * as d3 from 'd3'
import { debounce } from 'debounce'
import { Flex, Button } from 'rebass'

import {
  useView
} from '../hooks'

import {
  formatNumber,
  useSized,
  Reset
} from '@dredge/main'

import { BulkDifferentialExpression } from '../types'

const { useRef, useState, useEffect } = React

const PValueSelectorContainer = styled.div`
  position: absolute;
  top: 6px;
  bottom: 58px;
  left: 0;
  right: 20px;


  display: flex;
  flex-direction: column;

  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px;
  margin: 0 -4px;

  & > :not([class="pvalue-histogram"]) {
    margin-bottom: 1rem;
    flex-grow: auto;
  }

  .pvalue-histogram {
    flex: 1 1 0;
    position: relative;
  }

  .p-controller button {
    padding: 4px 6px;
  }

  .p-controller > :first-child {
    flex-grow: 1;
    border-radius: 4px 0 0 4px;
    margin-right: -1px;
    text-align: left;
    font-weight: 100;
  }
  .p-controller > :last-child {
    border-radius: 0 4px 4px 0;
    background-color: #f0f0f0;
  }

  .p-controller > :hover {
    background-color: #e0e0e0;
  }

  .p-controller :focus {
    z-index: 1
  }

  .histogram {
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    background-color: #f9f9f9;
    border: 1px solid #ccc;
  }

  .pvalue-histogram input {
    -webkit-appearance: slider-vertical;
  }

  .histogram-bar {
    background: maroon;
  }

  .histogram-brush {
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    border: 1px solid #ccc;
    cursor: ns-resize;
  }

  .brush-container .handle,
  .brush-container .selection {
    display: none;
  }

  .brush-container .overlay {
    cursor: ns-resize;
  }

`

type PValueSelectorProps = {
  onChange: (pValue: number) => void;
}

function usePValueHistogram() {
  const view = useView()
      , { pairwiseData } = view

  if (!pairwiseData) return null

  const { minPValue } = pairwiseData

  // Make the minimum p-value 1 order of magnitude less than the smallest
  // p-value in the pairwise data (rounded down to the nearest place)
  const scaleMinimum = (
    Math.pow(10, Math.floor(Math.log10(minPValue)) - 1))

  let logScale = d3.scaleLog()
      .domain([scaleMinimum, 1])

  const ticks = [0, ...logScale.ticks(100)]

  logScale = logScale.range([ticks.length, 0])

  const histogram = d3.histogram<BulkDifferentialExpression, number>()
    .value(x => x.pValue || 1)
    .domain([0, 1])
    .thresholds(ticks)

  const bins = histogram([...pairwiseData.values()]).map(x => x.length)

  const scale = d3.scaleLinear()
    .domain([0, d3.max(bins)!])
    .range([0, 100])

  return {
    bins,
    scale,
    logScale,
    ticks,
  }
}

export default function PValueSelector(props: PValueSelectorProps) {
  const view = useView()
      , histogram = usePValueHistogram()
      , { onChange } = props
      , { comparedTreatments, pValueThreshold } = view

  const handleChange = debounce((pValue: number) => {
    if (!histogram) return

    let threshold = pValue

    const scaleMinimum = histogram.logScale.domain()[0]!

    if (threshold < (scaleMinimum * 1.5)) {
      // Lock to 0 if the p-value is small
      threshold = 0
    } else if (threshold > 1) {
      threshold = 1
    }

    onChange(threshold)
  }, 10)

  return (
    h(PValueSelectorContainer, null, ...[
      h('p', null, 'P value cutoff'),

      h(Flex, { className: 'p-controller' }, ...[
        h(Button, {
          onClick: () => {
            let value: number = 1

            const valueStr = prompt(
              'Enter a p-value. (e.g. .0005, 1e-24)',
              pValueThreshold.toString())

            if (valueStr !== null) {
              const parsed = parseFloat(valueStr)

              const ok = (
                !isNaN(parsed) &&
                parsed >= 0 &&
                parsed <= 1
              )

              if (ok) {
                value = parsed
              }
            }

            handleChange(value)
          },
        }, formatNumber(pValueThreshold)),

        h(Button, {
          onClick: () => {
            handleChange(1)
          },
          style: {
            display: 'flex',
          },
        }, h(Reset, { height: 12 })),
      ]),

      h('div', {
        className: 'pvalue-histogram',
      }, ...[
        h('div', {
          className: 'histogram',
        }, histogram && histogram.bins.reverse().map((ct, i) =>
          h('span', {
            key: `${comparedTreatments}-${i}`,
            className: 'histogram-bar',
            style: {
              height: `${100 / histogram.ticks.length}%`,
              top: `${i * (100 / histogram.ticks.length)}%`,
              width: ct === 0 ? 0 : `${histogram.scale(ct)}%`,
              minWidth: ct === 0 ? 0 : '2px',
              opacity: histogram.logScale.invert(i) <= pValueThreshold ? 1 : .33,
            },
        }))),

        histogram && h(PValueBrush, {
          scale: histogram.logScale,
          onPValueChange: handleChange,
          comparedTreatments,
        }),
      ]),
    ])
  )
}

type PValueBrushState = {
  hoveredPValue: number | null,
  hoveredPosition: number | null,
}

type PValueBrushProps = {
  onPValueChange: (pValue: number) => void;
  scale: d3.ScaleLogarithmic<number, number>;
}

function PValueBrush(props: PValueBrushProps) {
  const view = useView()
      , [ outerRef, rect ] = useSized()
      , svgRef = useRef<SVGSVGElement>()
      , brushStart = useRef(0)

  const [{
    hoveredPValue,
    hoveredPosition,
  }, setState ] = useState<PValueBrushState>({
    hoveredPValue: null,
    hoveredPosition: null,
  })

  useEffect(() => {
    const svgEl = svgRef.current

    if (!svgEl) return
    if (!rect) return

    const { height } = rect
        , { scale: _scale, onPValueChange } = props

    const scale = _scale.range([height, 0])

    d3.select(svgEl).selectAll('*').remove()

    const g = d3.select(svgEl)
      .append('g')
      .on('mouseleave', () => {
        setState(prev => ({
          ...prev,
          hoveredPValue: null,
        }))
      })
      .on('mousemove', (e: MouseEvent) => {
        setState(prev => ({
          ...prev,
          hoveredPValue: scale.invert(e.offsetY),
          hoveredPosition: e.offsetY,
        }))
      })

    const setPValue = (value: number) => {
      onPValueChange(value)
    }

    const brush = d3.brushY()
      .on('start', (e: d3.D3BrushEvent<never>) => {
        const { selection } = e

        if (!selection) return

        const [ yCoord ] = selection as [number, number]

        brushStart.current = yCoord

        setPValue(scale.invert(yCoord))
      })
      .on('brush', (e: d3.D3BrushEvent<never>) => {
        const { selection } = e

        if (!selection) return

        let [ yCoord ] = (selection as [number, number]).filter(x => x !== brushStart.current)

        if (yCoord === undefined && brushStart.current) {
          yCoord = brushStart.current
        }

        if (yCoord == null) return

        setPValue(scale.invert(yCoord))

        setState(prev => ({
          ...prev,
          hoveredPValue: scale.invert(yCoord!),
          hoveredPosition: yCoord!,
        }))
      })

    g.call(brush)
  }, [rect, view.comparedTreatments])

  return (
    h('div', {
      style: {
        height: '100%',
        width: '100%',
      },
      ref: outerRef,
    }, ...[
      h('svg', {
        className: 'brush-container',
        style: {
          position: 'absolute',
        },
        width: rect ? rect.width : null,
        height: rect ? rect.height : null,
        ref: svgRef,
      }),

      hoveredPValue === null ? null : h('span', {
        style: {
          position: 'absolute',
          left: '100%',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          whiteSpace: 'nowrap',
          padding: '6px',
          zIndex: 1,
          top: hoveredPosition,
          marginTop: '-16px',
        },
      }, formatNumber(hoveredPValue)),
    ])
  )
}
