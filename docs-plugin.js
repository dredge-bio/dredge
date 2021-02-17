"use strict";

module.exports = {
  name: 'Documentation plugin',
  setup(build) {
    build.onResolve({ filter: /\.md/ }, args => {
      const path = require('path')

      return { path: path.join(process.cwd(), 'documentation', args.path) }
    })

    build.onLoad({ filter: /\.md$/ }, args => {
      const fs = require('fs')
          , MarkdownIt = require('markdown-it')
          , { version } = require('./package.json')
          , md = new MarkdownIt({ html: true })

      const replacements = [
        [/%%VERSION%%/g, version],
        [/%%VERSION-PREFIXED%%/g, `dredge-${version}`],
        [/%%ZIP-FILENAME%%/g, `dredge-${version}.zip`],
        [/%%PROJECT-DIR%%/g, `dredge-${version}`],
        [/%%PROJECT-DATA-DIR%%/g, `dredge-${version}/data`],
      ]

      md.use(require('markdown-it-attrs'))

      let markdown = fs.readFileSync(args.path).toString()

      replacements.forEach(([pattern, subst]) => {
        markdown = markdown.replace(pattern, subst)
      })

      const contents = md.render(markdown)

      return {
        contents,
        loader: 'text',
      }
    })
  },
}

/*

  return through(function (buf, enc, next) {
    this.push(buf.toString('utf-8').replace(REGEX, (match, filename) => {
      let markdown = fs.readFileSync('./documentation/' + filename).toString()


      return JSON.stringify(contents)
    }))
    next()
  })
}
*/
