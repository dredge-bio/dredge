import * as t from 'io-ts'
import * as d3 from 'd3'
import { withValidate } from 'io-ts-types'

import { delay } from '@dredge/main'

import { ProjectField } from '@dredge/main'
import * as types from './types'

export const treatments = new ProjectField({
  label: 'Project treatments',
  required: true,
  cached: false,
  async processValidated(obj) {
    return new Map(Object.entries(obj))
  },
  decoder: t.record(
    t.string, t.type({
      label: t.string,
      replicates: t.array(t.string),
    })
  ),
})


export const abundanceMeasures = new ProjectField({
  label: 'Transcript abundance measures',
  required: true,
  cached: false,
  async processValidated([ replicateRow, abundanceRows ]) {
    const replicates = replicateRow.split('\t').slice(1)
        , transcripts: Array<string> = []
        , abundances: number[][] = []

    let i = 0

    for (const row of abundanceRows) {
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
  }),
})

function cleanSVGString(svgString: string, treatments: types.BulkTreatmentMap) {
  const parser = new DOMParser()
      , svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
      , iterator = svgDoc.createNodeIterator(svgDoc, NodeFilter.SHOW_ELEMENT)
      , treatmentNames = new Set(treatments.keys())

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
      case 'polygon':
      case 'g': {
        let treatment: (null | string) = null

        const popTreatmentFromAttr = (attr: string) => {
          treatment = node.getAttribute(attr)
          if (treatment && treatmentNames.has(treatment)) {
            node.removeAttribute(attr)
            return treatment
          }
          return null
        }

        treatment = (
          popTreatmentFromAttr('id') ||
          popTreatmentFromAttr('name')
        )

        if (treatment !== null) {
          // `treatment` will always be in the treatment map, since it was
          // derived from the `treatmentNames` set, a set of all the keys in
          // the map.
          const { label } = treatments.get(treatment)!

          node.setAttribute('data-treatment', treatment)

          if (node.nodeName === 'g') {
            Array.from(node.querySelectorAll('*')).forEach(el => {
              if (!el.hasAttribute('data-treatment')) {
                el.setAttribute('data-treatment', treatment!)
              }
            })
          }

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
    (el as SVGElement).replaceWith(el.children[0]!)
  })

  return svgDoc.documentElement.outerHTML
}

export const svg = new ProjectField({
  label: 'SVG diagram',
  required: false,
  cached: false,
  processResponse(resp) {
    return resp.text()
  },
  decoder: t.string,
  async processValidated(str, context: { treatments: types.BulkTreatmentMap }) {
    return cleanSVGString(str, context.treatments)
  },
})

export const grid = new ProjectField({
  label: 'Transcript grid',
  required: false,
  cached: false,
  processResponse(resp) {
    return resp.text()
  },
  decoder: withValidate(t.array(t.array(t.string)), (input, context) => {
    if (typeof input !== 'string') {
      return t.failure(input, context, 'Input was not a string')
    }

    let grid: string[][]

    if (input.includes('\t')) {
      grid = d3.tsvParseRows(input)
    } else {
      grid = d3.csvParseRows(input)
    }

    return t.success(grid)
  }),
  async processValidated(grid, context: { treatments: types.BulkTreatmentMap }) {
    const { treatments } = context

    return grid.map(row => row.map(treatment => {
      if (!treatment) return null

      if (!treatments.has(treatment)) {
        throw new Error(`Treatment ${treatment} not in project`)
      }

      return treatment
    }))
  },

})
