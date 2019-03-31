"use strict";

const fs = require('fs')
    , through = require('through2')
    , MarkdownIt = require('markdown-it')

const REGEX = /require\('([\w_]+.md)'\)/g

const md = new MarkdownIt({ html: true })

const version = require('./package.json').version

const replacements = [
  [/%%VERSION%%/g, version],
  [/%%VERSION-PREFIXED%%/g, `dredge-${version}`],
  [/%%ZIP-FILENAME%%/g, `dredge-${version}.zip`],
  [/%%PROJECT-DIR%%/g, `dredge-${version}`],
  [/%%PROJECT-DATA-DIR%%/g, `dredge-${version}/data`],
]

module.exports = function () {
  return through(function (buf, enc, next) {
    this.push(buf.toString('utf-8').replace(REGEX, (match, filename) => {
      let markdown = fs.readFileSync('./documentation/' + filename).toString()

      replacements.forEach(([pattern, subst]) => {
        markdown = markdown.replace(pattern, subst)
      })

      const contents = md.render(markdown)

      return JSON.stringify(contents)
    }))
    next()
  })
}
