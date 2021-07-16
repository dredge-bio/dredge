import * as R from 'ramda'
import * as t from 'io-ts'
import { useRef } from 'react'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { useOptions } from 'org-shell'
import { LoadedProject } from '@dredge/main'

import { getTranscriptLookup, getSearchTranscripts } from './util'

export function useTranscripts(project: LoadedProject) {
  const { transcripts } = project.data

  return {
    transcripts,
    getCanonicalTranscriptLabel: getTranscriptLookup(project),
    searchTranscripts: getSearchTranscripts(project),
  }
}


export function makeUseViewOptions<A, O>(
  codec: t.Type<A, O, unknown>
) {
  return function useViewOptions(): [
    A,
    (newOptions: Partial<A>) => void
  ] {
    const prevOptionsRef = useRef<A | null>(null)
        , prevOptions = prevOptionsRef.current

    // FIXME: For some reason I can't figure out, if I put the following
    // two things (`validateOptsion` and `defaultOptions` in the closure
    // above this, it doesn't work-- the imports for `fp-ts/Either` and
    // `fp-ts/function` are marked as undefined. My best guess is that it's
    // some kind of circular import situation. It might be worth revisiting,
    // but it's been frustrating me for several hours, so I give up right now.
    const validateOptions = (options: unknown) => {
      return pipe(
        codec.decode(options),
        fold(() => { throw new Error() }, value => value))
    }

    const defaultOptions = codec.encode(validateOptions({}))

    const [ options, setOptions ] = useOptions()
        , validatedOptions = validateOptions(options)

    if (prevOptions !== null) {
      for (const k in validatedOptions) {
        if (R.equals(validatedOptions[k], prevOptions[k])) {
          validatedOptions[k] = prevOptions[k]
        }
      }
    }

    prevOptionsRef.current = validatedOptions

    const setValidatedOptions = (newOptions: Partial<A>) => {
      setOptions(prevOptions => {
        const next = {
          ...validateOptions(prevOptions),
          ...newOptions,
        }

        const output = codec.encode(next)

        for (const k in output) {
          const key = k as keyof O

          if (R.equals(output[key], defaultOptions[key])) {
            delete output[key]
          }
        }

        return Object.keys(output).length === 0
          ? null
          : output
      })
    }

    return [ validatedOptions, setValidatedOptions ]
  }
}
