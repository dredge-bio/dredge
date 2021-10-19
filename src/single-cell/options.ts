import * as t from 'io-ts'
import { withFallback } from 'io-ts-types'
import { SingleCellSortPath } from './types'
import { TableSortOrder } from '@dredge/shared'

const selectedClusterCodec = new t.Type<
  Set<string>,
  string | null
>(
  'selectedCluster',
  (u): u is Set<string> =>
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
  a => a.size === 0 ? null : [...a].join(',')
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

const sortPathCodec = new t.Type<
  SingleCellSortPath,
  string | null
>(
  'sortBy',
  (u): u is SingleCellSortPath => (
    u === 'transcript' ||
    u === 'hasInsitu' ||  (
      typeof u === 'object' &&
      u !== null
    )
  ),
  (u, c) => {
    if (typeof u === 'string') {
      if (u === 'transcript') return t.success('transcript' as SingleCellSortPath)
      if (u === 'hasInsitu') return t.success('hasInsitu' as SingleCellSortPath)

      const periodIdx = u.indexOf('.')

      if (periodIdx === -1) return t.failure(u, c)

      const value = u.slice(0, periodIdx)
          , cluster = u.slice(periodIdx + 1)

      if (!cluster) {
        return t.failure(u, c)
      }

      if (value === 'logFC' || value === 'pValue') {
        return t.success({
          cluster,
          value,
        })
      }
    }

    return t.failure(u, c)
  },
  x => {
    if (typeof x === 'string') return x
    return `${x.value}.${x.cluster}`
  }
)

const sortOrderCodec = new t.Type<
  TableSortOrder,
  string | null
>(
  'sortOrder',
  (u): u is TableSortOrder =>
    u === 'asc' ||
    u === 'desc',
  (u, c) => {
    if (u === 'asc') return t.success('asc')
    if (u === 'desc') return t.success('desc')
    return t.failure(u, c)
  },
  x => x
)


export const optionsCodec = t.type({
  sortOrder: withFallback(sortOrderCodec, 'asc'),
  sortBy: withFallback(sortPathCodec, 'transcript'),
  selectedClusters: withFallback(selectedClusterCodec, new Set()),
  selectedTranscripts: withFallback(selectedTranscriptsCodec, new Set()),
})
