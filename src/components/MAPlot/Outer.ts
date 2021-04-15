import h from 'react-hyperscript'
import * as R from 'ramda'

import styled from 'styled-components'
import { useOptions } from 'org-shell'

import { useAppSelector, useAppDispatch } from '../../hooks'
import { projectForView } from '../../utils'

import padding from './padding'
import Plot from './Plot'


const PlotWrapper = styled.div<{
  padding: typeof padding
}>`
.button-group {
  display: flex;
}

.button-group button {
  border-radius: 0;
}

.button-group button:last-of-type {
  border-radius: 0 4px 4px 0;
}

.button-group button:first-of-type {
  border-radius: 4px 0 0 4px;
}

.button-group button + button {
  margin-left: -1px;
}

[data-active] {
  position: relative;
}

[data-active]:focus {
  z-index: 1;
}

.bin-selected,
.bin-hovered {
  stroke: red;
  stroke-width: 2px;
}

[data-active="true"]::after {
  position: absolute;
  content: " ";
  left: 4px;
  right: 4px;
  height: 2px;
  background-color: hsl(205,35%,45%);
  bottom: -8px;
  border: 1px solid #eee;
  box-shadow: 0 0 0 1px #eee;
}

.help-text {
  position: absolute;
  left: ${props => props.padding.l + 16 }px;
  right: ${props => props.padding.r + 16 }px;
  top: ${props => props.padding.t + 8 }px;
  padding: .66rem;
  background-color: hsl(205,35%,85%);
  border: 1px solid hsl(205,35%,45%);
  text-align: center;
}
`

type OuterProps = {
  width: number;
  height: number;
  onBrush: (extend: [number, number, number, number] | null) => void
  persistBrush: (extend: [number, number, number, number] | null) => void
}


export default function Wrapper(props: OuterProps) {
  const [ opts, updateOpts ] = useOptions()
      , dispatch = useAppDispatch()

  const passedProps = useAppSelector(state => {
    const view = state.view?.default
        , project = projectForView(state)
        , { abundanceLimits } = project.config

    if (view == null) return null

    let treatmentA: string | undefined
      , treatmentB: string | undefined
      , treatmentALabel: string | undefined
      , treatmentBLabel: string | undefined

    const { comparedTreatments } = view

    if (comparedTreatments) {
      const labelForTreatment = (treatment: string) =>
        project.data.treatments.get(treatment)?.label || treatment

      treatmentA = comparedTreatments[0]
      treatmentB = comparedTreatments[1]
      treatmentALabel = labelForTreatment(treatmentA)
      treatmentBLabel = labelForTreatment(treatmentB)
    }

    const viewProps = R.pick([
      'loading',
      'brushedArea',
      'savedTranscripts',
      'pairwiseData',
      'pValueThreshold',
      'hoveredTranscript',
      'displayedTranscripts',
    ], view)

    return {
      abundanceLimits,
      treatmentA,
      treatmentB,
      treatmentALabel,
      treatmentBLabel,
      ...viewProps,
    }
  })

  if (passedProps === null) {
    return null
  }

  return (
    h(PlotWrapper, {
      padding,
      style: {
        height: '100%',
        width: '100%',
        position: 'relative',
      },
    }, [
      h(Plot, {
        dispatch,
        opts,
        updateOpts,
        ...props,
        ...passedProps,
      }),
    ])
  )
}
