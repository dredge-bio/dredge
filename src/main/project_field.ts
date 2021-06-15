import * as t from 'io-ts'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { fetchResource } from './utils'

import { LogStatus } from '@dredge/log'

import { PathReporter } from 'io-ts/PathReporter'


export class ProjectField<Validated, Processed=Validated, ProcessingContext=void> {
  label: string;
  required: boolean;
  cached: boolean;
  decoder: t.Decoder<unknown, Validated>;
  processResponse: (resp: Response) => Promise<any>;
  processValidated: (validated: Validated, context: ProcessingContext) => Promise<Processed>;

  constructor(config: {
    label: string,
    required: boolean,
    cached: boolean,
    decoder: t.Decoder<unknown, Validated>,
    processResponse?: (resp: Response) => Promise<any>,
    processValidated: (validated: Validated, context: ProcessingContext) => Promise<Processed>;
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
    makeLog: (label: string, url: string) => (status: LogStatus, message?: string) => void,
    context: ProcessingContext
  ) {
    const fullURL = new URL(url, window.location.toString()).href
        , log = makeLog(this.label, url ? fullURL : '')

    await log('Pending')

    if (!url) {
      log('Missing')
      return null
    }

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
            const processed = await this.processValidated(val, context)

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
