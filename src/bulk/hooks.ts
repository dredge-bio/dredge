import { BulkProject } from '@dredge/main'
import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux'
import { useOptions } from 'org-shell'
import { validateOptions, viewOptionsObject, ViewOptions } from './options'

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

const defaultOptions = validateOptions({})

export function useViewOptions(): [
  ViewOptions,
  (newOptions: Partial<ViewOptions>) => void
]{
  const [ options, setOptions ] = useOptions()

  const validatedOptions = validateOptions(options)

  const setValidatedOptions = (newOptions: Partial<ViewOptions>) => {
    setOptions(prevOptions => {
      const next = {
        ...validateOptions(prevOptions),
        ...newOptions,
      }

      const validated = viewOptionsObject.encode(next)

      for (const k in validated) {
        const key = k as keyof ViewOptions

        if (validated[key] === defaultOptions[key]) {
          delete validated[key]
        }
      }

      return Object.keys(validated).length === 0
        ? null
        : validated
    })
  }

  return [ validatedOptions, setValidatedOptions ]
}
