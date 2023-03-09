import * as t from 'io-ts'
import { fromNullable } from 'io-ts-types'
import { URLString, TranscriptHyperlink } from '@dredge/shared'

export const configuration = t.type({
  type: t.literal('SingleCell'),
  label: t.string,

  clusterLevels: URLString,
  seuratEmbeddings: URLString,
  seuratMetadata: URLString,
  transcripts: URLString,
  expressionData: URLString,
  differentialExpressions: URLString,

  // Optional
  permalinkPrefix: fromNullable(URLString, ''),
  readme: fromNullable(URLString, ''),
  transcriptHyperlink: fromNullable(TranscriptHyperlink, []),
  transcriptLabelTemplate: fromNullable(t.string, ''),
  transcriptImages: fromNullable(URLString, ''),
})

export type SingleCellConfiguration = t.TypeOf<typeof configuration>
