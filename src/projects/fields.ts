import * as t from 'io-ts'
import { fold, isLeft, Left, Right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { withValidate, fromNullable } from 'io-ts-types'

import { fetchResource, delay } from '../utils'
import * as types from '../ts_types'

import { PathReporter } from 'io-ts/PathReporter'

import MarkdownIt from 'markdown-it'

async function asyncIdentity<T>(x: T) { return x }


class ProjectField<T, V=T> {
  label: string;
  required: boolean;
  cached: boolean;
  decoder: t.Decoder<unknown, T>;
  processResponse: (resp: Response) => Promise<any>;
  processValidated: (validated: T, treatments?: Record<string, types.ProjectTreatment>) => Promise<V>;

  constructor(config: {
    label: string,
    required: boolean,
    cached: boolean,
    decoder: t.Decoder<unknown, T>,
    processResponse?: (resp: Response) => Promise<any>,
    processValidated: (validated: T, treatments?: Record<string, types.ProjectTreatment>) => Promise<V>;
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
    makeLog: (label: string, url: string) => (status: types.LogStatus, message?: string) => void,
    treatments?: Record<string, types.ProjectTreatment>
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
            const processed = await this.processValidated(val, treatments)

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

export const treatments = new ProjectField<
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

export const abundanceMeasures = new ProjectField<
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
  decoder: withValidate(t.tuple([
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

function trim(x: string) {
  return x.trim()
}

function notBlank(x: string) {
  return x
}

export const aliases = new ProjectField<
  string,
  Record<string, Array<string>>
>({
  label: 'Transcript aliases',
  required: false,
  cached: false,
  processResponse(resp) {
    return resp.text()
  },
  decoder: t.string,
  async processValidated(str) {
    const aliases: Record<string, Array<string>> = {}

    let i = 0

    for (const line of str.split('\n')) {
      const [ canonical, ...others ] = line.split(/\t|,/).map(trim).filter(notBlank)
      aliases[canonical] = others
      i++
      if (i % 1500 === 0) await delay(0)
    }

    return aliases
  }
})

export const readme = new ProjectField<
  string
>({
  label: 'Project documentation',
  required: false,
  cached: false,
  processResponse(resp) {
    return resp.text()
  },
  decoder: t.string,
  async processValidated(str) {
    const md = new MarkdownIt()
    return md.render(str)
  }
})

function cleanSVGString(svgString: string, treatments: Record<string, types.ProjectTreatment>) {
  const parser = new DOMParser()
      , svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
      , iterator = svgDoc.createNodeIterator(svgDoc, NodeFilter.SHOW_ELEMENT)
      , treatmentNames = new Set(Object.keys(treatments))

  let curNode: Node | null

  svgDoc.createNodeIterator

  Array.from(svgDoc.querySelectorAll('title')).forEach(el => {
    el.parentNode?.removeChild(el)
  })

  const anchorsToRemove = []

  while ( (curNode = iterator.nextNode()) ) {
    const node = curNode as SVGElement

    switch (node.nodeName.toLowerCase()) {
      case 'path':
      case 'rect':
      case 'circle':
      case 'elipse':
      case 'polyline':
      case 'polygon': {
        let treatment = null

        const popTreatmentFromAttr = (attr: string) => {
          treatment = node.getAttribute(attr)

          if (treatment !== null && treatmentNames.has(treatment)) {
            node.removeAttribute(attr)
            return true
          }
          return false
        }

        popTreatmentFromAttr('id') || popTreatmentFromAttr('name')

        if (treatment) {
          const { label } = treatments[treatment]

          node.setAttribute('data-treatment', treatment)

          const titleEl = document.createElement('title')
          titleEl.textContent = label || treatment

          node.appendChild(titleEl)
          treatmentNames.delete(treatment)

          // Illustrator, for some reason, makes all paths the child of
          // an anchor tag. That messes up our clicking business. We
          // could probably preventDefault() or stopPropagation()
          // somewhere, but I'm just removing them here.
          const replaceParent = (
            node.parentNode?.nodeName.toLowerCase() === 'a' &&
            node.parentNode?.children.length === 1
          )

          if (replaceParent) {
            anchorsToRemove.push(node.parentNode)
          }
        }

        break;
      }
    }

    // Remove ID, since multiple instances of this SVG will be in the
    // document. Alternatively, the whole thing could always be wrapped
    // in an iframe, but that would require inter-frame communication,
    // which seems like a pain in the ass.
    node.removeAttribute('id')
  }

  anchorsToRemove.forEach(el => {
    if (!el) return
    (el as SVGElement).replaceWith(el.children[0])
  })

  return svgDoc.documentElement.outerHTML
}

export const svg = new ProjectField<
  string
>({
  label: 'SVG diagram',
  required: false,
  cached: false,
  processResponse(resp) {
    return resp.text()
  },
  decoder: t.string,
  async processValidated(str, treatments) {
    if (!treatments) throw new Error('Can\'t parse SVG without treatments')

    return cleanSVGString(str, treatments)
  }
})
