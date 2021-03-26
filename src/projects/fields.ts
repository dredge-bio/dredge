import * as t from 'io-ts'
import { fold, isLeft, Left, Right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { withValidate, fromNullable } from 'io-ts-types'

import { fetchResource, delay } from '../utils'
import * as types from '../ts_types'

import { PathReporter } from 'io-ts/PathReporter'

async function asyncIdentity<T>(x: T) { return x }


class TreatmentField<T, V=T> {
  label: string;
  required: boolean;
  cached: boolean;
  decoder: t.Decoder<unknown, T>;
  processResponse: (resp: Response) => Promise<any>;
  processValidated: (validated: T) => Promise<V>;

  constructor(config: {
    label: string,
    required: boolean,
    cached: boolean,
    decoder: t.Decoder<unknown, T>,
    processResponse?: (resp: Response) => Promise<any>,
    processValidated: (validated: T) => Promise<V>;
  }) {
    this.label = config.label;
    this.required = config.required;
    this.cached = config.cached;
    this.decoder = config.decoder;

    this.processResponse = config.processResponse || (
      async (resp: Response) => {
        try {
          const data = await resp.json()
          return data
        } catch (e) {
          throw new Error('File is not valid JSON')
        }
      }
    )

    this.processValidated = config.processValidated
  }

  async validateFromURL(
    url: string,
    makeLog: (label: string, url: string) => (status: types.LogStatus, message?: string) => void
  ) {
    const fullURL = new URL(url, window.location.toString()).href
        , log = makeLog(this.label, fullURL)

    await log('Pending')

    try {
      const resp = await fetchResource(url, this.cached)
          , value = await this.processResponse(resp)

      return pipe(
        this.decoder.decode(value),
        fold(
          errors => {
            log('Failed', errors.join('\n'))

            const errString = PathReporter.report({ _tag: 'Left', left: errors })

            throw Error(errString.join('\n'))
          },
          async val => {
            const processed = await this.processValidated(val)

            await log('OK')

            return processed
          }
        ))
    } catch (e) {
      log('Failed', e.message)
      return null
    }

  }
}
/*
  abundanceMeasures: {
    label: 'Transcript abundance measures',
    exec: async (url, treatments) => {
      const resp = await fetchResource(url)

      try {
        return await parseAbundanceFile(resp, treatments)
      } catch (e) {
        throw new Error('Error parsing file')
      }
    },
  },
  */

export const treatments = new TreatmentField<
  Record<string, types.ProjectTreatment>
>({
  label: 'Project treatments',
  required: true,
  cached: false,
  processValidated: asyncIdentity,
  decoder: t.record(
    t.string, t.type({
      label: t.string,
      replicates: t.array(t.string),
    })
  )
})

export const abundanceMeasures = new TreatmentField<
  [ replicateRow: string, abundances: Array<string> ],
  {
    transcripts: Array<string>,
    replicates: Array<string>,
    abundances: number[][],
  }
>({
  label: 'Transcript abundance measures',
  required: true,
  cached: false,
  async processValidated([ replicateRow, abundanceRows ]) {
    const replicates = replicateRow.split('\t').slice(1)
        , transcripts: Array<string> = []
        , abundances: number[][] = []

    const numReplicates = replicates.length

    let i = 0

    for (let row of abundanceRows) {
      const entries = row.split('\t')
          , transcript = entries.shift()

      if (transcript === undefined) {
        throw new Error(`Error on line ${i}: line is blank`)
      }

      transcripts.push(transcript)

      const abundancesInRow = entries.map(parseFloat)
      abundances.push(abundancesInRow)

      i++

      if (i % 1000 === 0) await delay(0)
    }

    return {
      transcripts,
      replicates,
      abundances,
    }
  },
  processResponse(resp) {
    return resp.text()
  },
  decoder: withValidate( t.tuple([
    t.string,
    t.array(t.string),
  ]), (input, context) => {
    if (typeof input !== 'string') {
      return t.failure(input, context, 'Input is not a string')
    }

    const abundanceRows = input.split(/\r\n|\r|\n/)

    const replicateRow = abundanceRows.shift()

    if (replicateRow == undefined) {
      return t.failure(input, context, 'File is blank')
    }

    return t.success([ replicateRow, abundanceRows] )
  })
})
