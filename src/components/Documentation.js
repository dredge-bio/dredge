"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , instructions = require('instructions.md')
    , fieldHelp = require('fields.md')

const fields = R.pipe(
  s => s.split(/<!-- ([^ ]+) -->/).slice(1),
  R.splitEvery(2),
  R.fromPairs
)(fieldHelp)

fields.instructions = instructions

const DocumentationWrapper = styled('div')`
code, pre {
  font-family: monospace;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: black;
  white-space: nowrap;
  padding: 2px 6px;
}

pre > code {
  border: unset;
  white-space: pre-line;
  padding: unset;
}

pre {
  padding: .75rem 1rem;
}

ul, p {
  line-height: 19px;
  margin: ${props => props.theme.space[3]}px 0;
}

li p {
  margin: 0;
  margin: ${props => props.theme.space[2]}px 0;
}

`

module.exports = function Documentation({ fieldName }) {
  return h(DocumentationWrapper, {
    dangerouslySetInnerHTML: {
      __html: fields[fieldName],
    },
  })
}

