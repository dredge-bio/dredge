import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'

import { TreatmentName } from '../types'
import { useView, useViewProject } from '../view'

import TreatmentListSelector from './TreatmentListSelector'

const { useEffect, useRef, useState } = React

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
    fill: lightsteelblue;
  }

  & .active {
    stroke: blue;
    stroke-width: 5px;
  }
`

export default function TreatmentSelector(props: SelectorProps) {
  const ref = useRef<HTMLDivElement>()
      , view = useView()
      , project = useViewProject()
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

  useEffect(() => {
    const node = ref.current

    if (node && svg) {
      node.innerHTML = svg
    }
  }, [ref.current])

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
        React.createElement(TreatmentListSelector, {
          selectedTreatment,
          onSelectTreatment(treatmentName: string) {
            onSelectTreatment(treatmentName)
          },
        })
      ),
    ])
  )
}
