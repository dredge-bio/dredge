import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'

import { TreatmentName } from '../../types'
import { useView, useViewProject } from '../../view'

import TreatmentSelect from './Select'

const { useEffect, useRef, useCallback, useState } = React

type SelectorProps = {
  useSelectBackup: boolean;
  selectedTreatment: TreatmentName | null;
  onSelectTreatment: (treatment: TreatmentName, bottom?: boolean) => void;
  tooltipPos: 'bottom' | 'top';
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
      , project = useViewProject()
      , svgRef = useRef<SVGSVGElement>()
      , { svg, treatments } = project.data
      , { loading, hoveredTreatment } = view

  const {
    tooltipPos,
    useSelectBackup,
    selectedTreatment,
    onSelectTreatment,
  } = props

  const useSelectElement = (
    svg == null &&
    useSelectBackup
  )

  const [ localHoveredTreatment, setLocalHoveredTreatment ] = useState<null | string>(null)

  const showTooltip = (
    !!tooltipPos &&
    !!localHoveredTreatment
  )

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
          setLocalHoveredTreatment((el as SVGElement).dataset.treatment || null)
        })

        el.addEventListener('mouseleave', () => {
          setLocalHoveredTreatment(null)
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

  return (
    h(SelectorWrapper, [
      svg && h('div.svg-wrapper', [
        h('div', { ref }),

        /*
        !showTooltip ? null : (
          h(Tooltip, { pos: tooltipPos }, [
            h('span', treatments.get(localHoveredTreatment!)?.label),
          ])
        )
        */
      ]),

      !useSelectElement ? null : (
        React.createElement(TreatmentSelect, {
          selectedTreatment,
          onSelectTreatment(treatmentName: string) {
            onSelectTreatment(treatmentName)
          },
        })
      ),
    ])
  )
}
