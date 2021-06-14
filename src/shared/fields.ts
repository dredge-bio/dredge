import * as t from 'io-ts'

import { delay } from '@dredge/main'

import MarkdownIt from 'markdown-it'

import { ProjectField } from '@dredge/main'

function trim(x: string) {
  return x.trim()
}

function notBlank(x: string) {
  return x
}

export const aliases = new ProjectField({
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

      // Make sure the line is not blank
      if (!canonical) continue

      aliases[canonical] = others
      i++
      if (i % 1500 === 0) await delay(0)
    }

    return aliases
  },
})

export const readme = new ProjectField({
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
  },
})
