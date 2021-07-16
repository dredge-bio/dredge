import { BulkProject } from '@dredge/main'
import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux'
import { optionsCodec } from './options'
import { makeUseViewOptions } from '@dredge/shared'

import {
  BulkStoreDispatch,
  BulkStoreState
} from './store'

import {
  getAbundanceLookup,
  getColorScaleLookup
} from './utils'

export { useTranscripts } from '@dredge/shared'

export const useViewDispatch = () => useDispatch<BulkStoreDispatch>()

export const useViewSelector: TypedUseSelectorHook<BulkStoreState> = useSelector

export function useView() {
  return useViewSelector(state => state)
}

export function useAbundances(project: BulkProject) {
  return {
    abundancesForTreatmentTranscript: getAbundanceLookup(project),
    colorScaleForTranscript: getColorScaleLookup(project),
  }
}

export function useComparedTreatmentLabels() {
  const { comparedTreatments, project } = useView()

  let treatmentALabel: string | null = null
    , treatmentBLabel: string | null = null

  if (comparedTreatments) {
    const [ treatmentA, treatmentB ] = comparedTreatments

    treatmentALabel = project.data.treatments.get(treatmentA)?.label || treatmentA
    treatmentBLabel = project.data.treatments.get(treatmentB)?.label || treatmentB
  }

  return [ treatmentALabel, treatmentBLabel ]
}

export const useViewOptions = makeUseViewOptions(optionsCodec)
