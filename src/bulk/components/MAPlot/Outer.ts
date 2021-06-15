import h from 'react-hyperscript'
import * as R from 'ramda'

import styled from 'styled-components'
import { useOptions } from 'org-shell'

import { useView, useViewDispatch, useComparedTreatmentLabels } from '../../hooks'

import Plot from './Plot'


const PlotWrapper = styled.div`
.bin-selected,
.bin-hovered {
  stroke: red;
  stroke-width: 2px;
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
      , dispatch = useViewDispatch()
      , view = useView()
      , [ treatmentALabel, treatmentBLabel ] = useComparedTreatmentLabels()

  const { project } = view
      , { abundanceLimits } = project.config

  let treatmentA: string | undefined
    , treatmentB: string | undefined

  const { comparedTreatments } = view

  if (comparedTreatments) {
    treatmentA = comparedTreatments[0]
    treatmentB = comparedTreatments[1]
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

  const passedProps = {
    abundanceLimits,
    treatmentA,
    treatmentB,
    treatmentALabel,
    treatmentBLabel,
    ...viewProps,
  }

  return (
    h(PlotWrapper, {
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
