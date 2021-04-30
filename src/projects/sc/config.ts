import * as t from 'io-ts'
import { fromNullable } from 'io-ts-types'
import { URLString, TranscriptHyperlink } from '../config'

export const singleCellConfiguration = t.type({
  label: t.string,

  seuratEmbeddings: URLString,
  seurateMetadata: URLString,
  transcripts: URLString,
  expressionData: URLString,

  // Optional
  readme: fromNullable(URLString, ''),
  transcriptHyperlink: fromNullable(TranscriptHyperlink, []),
})

export type SingleCellConfiguration = t.TypeOf<typeof singleCellConfiguration>
