import * as t from 'io-ts'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { withFallback } from 'io-ts-types'
import { useOptions } from 'org-shell'

import { useAppSelector } from '../hooks'
import { useProject } from '../projects'

export function useView() {
  const view = useAppSelector(state => state.view && state.view.default)

  if (view === null) {
    throw new Error('No view is loaded')
  }

  return view
}

export function useViewProject() {
  const view = useView()

  return useProject(view.source, true)
}

function nullFallback<T extends t.Mixed>(codec: T) {
  return withFallback(t.union([t.null, codec]), null)
}

const viewOptionsObject = t.type({
  treatmentA: nullFallback(t.string),
  treatmentB: nullFallback(t.string),
  pValue: nullFallback(t.number),
  brushedArea: nullFallback(
    t.tuple([t.number, t.number, t.number, t.number])),
})

type ViewOptions = t.TypeOf<typeof viewOptionsObject>

export function useViewOptions(): [
  ViewOptions,
  (newOptions: Partial<ViewOptions>) => void
]{
  const [ options, setOptions ] = useOptions()

  const validatedOptions = pipe(
    viewOptionsObject.decode(options),
    fold(
      () => {
        throw new Error()
      },
      value => value))

  const setValidatedOptions = (newOptions: Partial<ViewOptions>) => {
    const newOptionsCopy = { ...newOptions }

    const deleteKeys: string[] = []

    Object.entries(newOptionsCopy).forEach(([ key, val ]) => {
      const optKey = key as keyof ViewOptions

      if (val == null) {
        delete newOptionsCopy[optKey]
        deleteKeys.push(optKey)
      }
    })

    setOptions(prevOpts => {
      const next = {
        ...prevOpts,
        ...newOptionsCopy,
      }

      deleteKeys.forEach(key => {
        delete next[key]
      })

      return Object.keys(next).length === 0
        ? null
        : next
    })
  }

  return [ validatedOptions, setValidatedOptions ]
}
