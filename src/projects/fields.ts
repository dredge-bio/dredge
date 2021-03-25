import * as t from 'io-ts'
import { fold, isLeft, Left, Right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { withValidate, fromNullable } from 'io-ts-types'

import { fetchResource } from '../utils'
import * as types from '../ts_types'

import { PathReporter } from 'io-ts/PathReporter'


class TreatmentField<T, V=T> {
  label: string;
  required: boolean;
  cached: boolean;
  decoder: t.Decoder<unknown, T>;
  processResponse: (resp: Response) => Promise<any>;

  constructor(
    label: string,
    required: boolean,
    cached: boolean,
    decoder: t.Decoder<unknown, T>,
    processResponse?: (resp: Response) => Promise<any>,
  ) {
    this.label = label;
    this.required = required;
    this.cached = cached;
    this.decoder = decoder;

    this.processResponse = processResponse || (
      async (resp: Response) => {
        try {
          const data = await resp.json()
          return data
        } catch (e) {
          throw new Error('File is not valid JSON')
        }
      }
    )
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

            /*
            if (this.required) {
              throw Error('Required field')
            }
            */

            return null
          },
          val => {
            log('OK', `Found ${Object.keys(val).length} treatments`)

            return val
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
>(
  'Project treatments',
  true,
  false,
  t.record(
    t.string, t.type({
      label: t.string,
      replicates: t.array(t.string),
    })
  )
)

export const abundanceMeasures = new TreatmentField<
  string
>(
  'Transcript abundance measures',
  true,
  false,
  withValidate(t.string, (input, context) => {
    if (typeof input !== 'string') {
      return t.failure(input, context, 'Input is not a string')
    }

    const abundanceRows = input.split(/\r\n|\r|\n/)

    const replicateRow = abundanceRows.shift()

    if (replicateRow == undefined) {
      return t.failure(input, context, 'File is blank')
    }

    const replicates = replicateRow.split('\t').slice(1)

    const transcripts = []
        , abundances = []

    return t.success(input)
  })
)
