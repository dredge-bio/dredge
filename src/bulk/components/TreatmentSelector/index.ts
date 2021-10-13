import { createElement as h } from 'react'
import styled from 'styled-components'
import * as React from 'react'
import * as d3 from 'd3'

import  * as viewActions from '../../actions'
import { useView, useViewDispatch, useAbundances } from '../../hooks'

import TreatmentSelect from './Select'
import Tooltip from './Tooltip'

const { useEffect, useRef, useCallback, useState } = React

type SelectorProps = {
  transcript: string | null;
  selectedTreatment?: string | null;
  onSelectTreatment: (treatment: string, bottom?: boolean) => void;
  tooltipPos: 'bottom' | 'top';
  heatMap?: boolean;
  useSelectBackup?: boolean;
  paintHovered?: boolean;
}

const SelectorWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 10px 0;

  & select {
    padding: 1em;
  }

  & svg, & div.svg-wrapper {
    height: 100%;
    width: 100%;
  }

  & div.svg-wrapper {
    position: relative;
  }

  & svg {
    position: absolute;
  }

  & svg path:hover,
  & svg rect:hover {
    fill: #ccc;
    cursor: pointer;
  }

  & svg .treatment-selected {
    stroke: black;
    stroke-width: 3px;
  }

  & .active {
    stroke: blue;
    stroke-width: 5px;
  }
`

export default function TreatmentSelector(props: SelectorProps) {
  const view = useView()
      , { project } = view
      , svgRef = useRef<SVGSVGElement>()
      , dispatch = useViewDispatch()
      , { svg, treatments } = project.data
      , { colorScaleForTranscript, abundancesForTreatmentTranscript } = useAbundances(project)

  const {
    heatMap,
    tooltipPos,
    paintHovered,
    useSelectBackup,
    selectedTreatment,
    onSelectTreatment,
  } = props

  const useSelectElement = (
    svg == null &&
    useSelectBackup
  )

  const [ localHoveredTreatment, setLocalHoveredTreatment ] = useState<null | string>(null)

  const ref = useCallback((el : HTMLDivElement | null) => {
    if (el && svg) {
      el.innerHTML = svg

      el.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as (SVGElement | HTMLElement)

        const { treatment } = target.dataset

        if (treatment) {
          onSelectTreatment(treatment, e.shiftKey)
        }
      })

      Array.from(el.querySelectorAll('[data-treatment]')).forEach(el => {
        el.addEventListener('mouseenter', () => {
          const treatment = (el as SVGElement).dataset.treatment || null
          setLocalHoveredTreatment(treatment)
          dispatch(viewActions.setHoveredTreatment({ treatment }))
        })

        el.addEventListener('mouseleave', () => {
          setLocalHoveredTreatment(null)
          dispatch(viewActions.setHoveredTreatment({ treatment: null }))
        })
      })

      svgRef.current = el.querySelector('svg')!
    }
  }, [])

  useEffect(() => {
    const svgEl = svgRef.current

    if (!svgEl) return

    Array.from(svgEl.querySelectorAll('.treatment-selected')).forEach(el => {
      el.classList.remove('treatment-selected')
    })

    if (!selectedTreatment) return

    const selectedEls = Array.from(svgEl.querySelectorAll(`[data-treatment="${selectedTreatment}"]`))

    selectedEls.forEach(el => {
      el.classList.add('treatment-selected')
    })
  }, [selectedTreatment])

  useEffect(() => {
    const svgEl = svgRef.current

    if (!heatMap) return
    if (!svgEl) return

    const elsForTreatments = new Map([...treatments.keys()].map(treatment => {
      const treatmentEls = Array.from(svgEl.querySelectorAll(`[data-treatment="${treatment}"]`)) as SVGElement[]

      return [treatment, treatmentEls]
    }))

    elsForTreatments.forEach(els => {
      els.forEach(el => {
        el.style.fill = 'none'
      })
    })

    const transcript = view.hoveredTranscript || view.focusedTranscript

    if (!transcript) return

    const colorScale = colorScaleForTranscript(transcript)

    elsForTreatments.forEach((treatmentEls, treatment) => {
      const abundances = abundancesForTreatmentTranscript(treatment, transcript)

      let abundanceMean: number

      if (abundances === null) {
        abundanceMean = 0
      } else {
        abundanceMean = d3.mean(abundances) || 0
      }

      treatmentEls.forEach(el => {
        el.style.fill = colorScale(abundanceMean)
      })
    })

  }, [view.hoveredTranscript, view.focusedTranscript])

  useEffect(() => {
    const svgEl = svgRef.current

    if (!paintHovered) return
    if (!svgEl) return

    Array.from(svgEl.querySelectorAll('[data-treatment]')).forEach(el => {
      el.classList.remove('active')
    })

    const treatmentEls = Array.from(
      svgEl.querySelectorAll(`[data-treatment="${view.hoveredTreatment}"]`)) as SVGElement[]

    treatmentEls.forEach(el => {
      el.classList.add('active')
    })

  }, [view.hoveredTreatment])

  return (
    h(SelectorWrapper, null, ...[
      svg && h('div.svg-wrapper', null, ...[
        h('div', { ref }),

        h(Tooltip, {
          position: tooltipPos,
          treatment: localHoveredTreatment,
        }),
      ]),

      !useSelectElement ? null : (
        h(TreatmentSelect, {
          selectedTreatment: selectedTreatment || null,
          onSelectTreatment(treatmentName: string) {
            onSelectTreatment(treatmentName)
          },
        })
      ),
    ])
  )
}
