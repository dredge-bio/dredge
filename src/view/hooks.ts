import * as t from 'io-ts'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { withFallback, withValidate } from 'io-ts-types'
import { useOptions } from 'org-shell'

import { useAppSelector } from '../hooks'

import {
  ProjectType,
  BulkViewState,
  SingleCellViewState
} from '../types'

export function useView(): BulkViewState | SingleCellViewState;
export function useView(projectType: 'Bulk'): BulkViewState;
export function useView(projectType: 'SingleCell'): SingleCellViewState;
export function useView(projectType?: ProjectType): (BulkViewState | SingleCellViewState) {
  const view = useAppSelector(state => state.view && state.view.default)

  if (view === null) {
    throw new Error('No view is loaded')
  }

  if (typeof projectType === undefined) {
    return view as BulkViewState | SingleCellViewState
  }

  if (projectType === 'Bulk' && view.project.type === 'Bulk') {
    return view as BulkViewState
  } else if (projectType === 'SingleCell' && view.project.type === 'SingleCell') {
    return view as SingleCellViewState
  } else {
    throw new Error()
  }
}

function nullFallback<T extends t.Mixed>(codec: T) {
  return withFallback(t.union([t.null, codec]), null)
}

type BrushedCoords = [number, number, number, number]

const brushedCodec = new t.Type<
  BrushedCoords,
  string
>(
  'brushedArea',
  (u): u is BrushedCoords =>
    Array.isArray(u) &&
      u.length === 4 &&
      u.every(x => typeof x === 'number'),
  (u, c) => {
    if (typeof u === 'string') {
      const numberStrs = u.split(',')

      if (numberStrs.length !== 4) {
        return t.failure(u, c)
      }

      const numbers = numberStrs.map(x => parseFloat(x)) as BrushedCoords

      if (!numbers.every(x => !isNaN(x))) {
        return t.failure(u, c)
      }

      // FIXME: validate that the coordinates are in the right order
      return t.success(numbers)
    }

    return t.failure(u, c)
  },
  a => a.join(',')
)



const viewOptionsObject = t.type({
  treatmentA: nullFallback(t.string),
  treatmentB: nullFallback(t.string),
  pValue: withValidate(t.number, input => {
    let val: number | null = null

    if (typeof input === 'number') {
      val = input
    } else if (typeof input === 'string') {
      const parsed = parseFloat(input)

      if (!isNaN(parsed)) {
        val = parsed
      }
    }

    if (val === null || val > 1) {
      val = 1
    } else if (val < 0) {
      val = 0
    }

    return t.success(val)
  }),
  brushed: nullFallback(brushedCodec),
})

type ViewOptions = t.TypeOf<typeof viewOptionsObject>

function validateOptions(options: Object) {
  return pipe(
    viewOptionsObject.decode(options),
    fold(
      () => {
        throw new Error()
      },
      value => value))
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

export function useComparedTreatmentLabels() {
  const { comparedTreatments, project } = useView('Bulk')

  let treatmentALabel: string | null = null
    , treatmentBLabel: string | null = null

  if (comparedTreatments) {
    const [ treatmentA, treatmentB ] = comparedTreatments

    treatmentALabel = project.data.treatments.get(treatmentA)?.label || treatmentA
    treatmentBLabel = project.data.treatments.get(treatmentB)?.label || treatmentB
  }

  return [ treatmentALabel, treatmentBLabel ]
}
