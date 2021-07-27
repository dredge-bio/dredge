import * as t from 'io-ts'
import { withFallback } from 'io-ts-types'

type SelectedClusters = Set<string> | null

const selectedClusterCodec = new t.Type<
  SelectedClusters,
  string | null
>(
  'selectedCluster',
  (u): u is SelectedClusters =>
    typeof u === 'object' &&
    u !== null &&
    u.constructor === Set &&
      [...u].every(x => typeof x === 'string'),
  (u, c) => {
    if (typeof u === 'string') {
      const clusters = u.split(',')

      for (const cluster of clusters) {
        if (typeof cluster !== 'string') {
          return t.failure(u, c)
        }
      }

      return t.success(new Set(clusters))
    }

    return t.failure(u, c)
  },
  a => a === null ? null : [...a].join(',')
)

type SelectedTranscripts = Set<string>

const selectedTranscriptsCodec = new t.Type<
  SelectedTranscripts,
  string | null
>(
  'selectedTranscripts',
  (u): u is SelectedTranscripts =>
    typeof u === 'object' &&
    u !== null &&
    u.constructor === Set &&
      [...u].every(x => typeof x === 'string'),
  (u, c) => {
    if (typeof u === 'string') {
      const transcripts = u.split(',')

      for (const transcript of transcripts) {
        if (typeof transcript !== 'string') {
          return t.failure(u, c)
        }
      }

      return t.success(new Set(transcripts))
    }

    return t.failure(u, c)
  },
  a => a.size === 0 ? null : [...a].join(',')
)



export const optionsCodec = t.type({
  selectedClusters: withFallback(t.union([ selectedClusterCodec, t.null ]), null),
  selectedTranscripts: withFallback(selectedTranscriptsCodec, new Set()),
})
