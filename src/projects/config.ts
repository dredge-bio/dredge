import * as t from 'io-ts'
import { withValidate, fromNullable } from 'io-ts-types'
import { fold, either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

const URLString = withValidate(t.string, (input, context) => {
  if (typeof input === 'string') {
    return t.success(input)
  }

  return t.failure(input, context, 'Input must be a string representing a URL')
})

const PairwiseName = withValidate(t.string, (input, context) => {
  return either.chain(
    URLString.validate(input, context),
    value => {
      const ok = (
        value.includes('%A') &&
        value.includes('%B')
      )

      if (ok) return t.success(value)

      return t.failure(
        value, context,
        'URL must include the strings "%A" and "%B" to refer to treatment names')

    }
  )
})

const coordTuple = t.tuple([
  t.tuple([t.number, t.number]),
  t.tuple([t.number, t.number]),
])

const AbundanceLimits = withValidate(coordTuple, (input, context) => {
  return pipe(
    coordTuple.validate(input, context),
    fold(
      () => {
        return t.failure(input, context, 'Value must be a matrix of two two-number arrays')
      },
      value => {
        const [[xMin, xMax], [yMin, yMax]] = value

        if (xMin >= xMax) {
          return t.failure(input, context, 'Minimum value of X axis cannot be greater than max value')
        }

        if (yMin >= yMax) {
          return t.failure(input, context, 'Minimum value of Y axis cannot be greater than max value')
        }

        return t.success(value)
      })
  )
})

const transcriptHyperlink = t.array(t.type({
  label: t.string,
  url: t.string,
}))

const TranscriptHyperlink = withValidate(transcriptHyperlink, (input, context) => {
  return pipe(
    transcriptHyperlink.validate(input, context),
    fold(
      () => {
        return t.failure(input, context, 'Value must be an array of objects with keys "label" and "url"')
      },
      value => {
        value.forEach(({ url }) => {
          if (!url.includes('%name')) {
            return t.failure(input, context, 'Each transcript hyperlink must include a url that includes the string "%name"')
          }
        })

        return t.success(value)
      })
    )
})

export const ConfigDef = t.type({
  label: t.string,
  abundanceMeasures: URLString,
  pairwiseName: PairwiseName,
  treatments: URLString,
  abundanceLimits: AbundanceLimits,

  // Optional
  url: fromNullable(URLString, ''),
  transcriptHyperlink: fromNullable(TranscriptHyperlink, []),
  heatmapMinimumMaximum: fromNullable(t.number, 0),
  readme: fromNullable(URLString, ''),
  transcriptAliases: fromNullable(URLString, ''),
  diagram: fromNullable(URLString, ''),
  grid: fromNullable(URLString, ''),
})

export type Config = t.TypeOf<typeof ConfigDef>
export type ConfigKey = keyof Config
