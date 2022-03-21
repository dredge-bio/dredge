import * as t from 'io-ts'
import { withValidate } from 'io-ts-types'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

export type Config = {
  label: string;
  readme: string,
  permalinkPrefix: string,
  transcriptHyperlink: Array<{
    label: string,
    url: string,
  }>;
}

export type TranscriptData = {
  transcripts: string[];
  transcriptCorpus: Record<string, string>;
  transcriptAliases: ([alias: string, transcript: string])[];
}

export const URLString = withValidate(t.string, (input, context) => {
  if (typeof input === 'string') {
    return t.success(input)
  }

  return t.failure(input, context, 'Input must be a string representing a URL')
})

const transcriptHyperlink = t.array(t.type({
  label: t.string,
  url: t.string,
}))

export const TranscriptHyperlink = withValidate(transcriptHyperlink, (input, context) => {
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

