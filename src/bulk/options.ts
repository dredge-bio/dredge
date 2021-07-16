import * as t from 'io-ts'
import { withFallback, withValidate } from 'io-ts-types'

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


export const optionsCodec = t.type({
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
