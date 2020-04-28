"use strict"

const h = require('react-hyperscript')
    , styled = require('styled-components').default
    , instructions = require('instructions.md')
    , fieldDocs = require('./fields')

const fields = {}

const thisURL = new URL('./', window.location.href).href

fields.instructions = instructions
  .replace(/%%THIS-URL%%/g, `<a href="${thisURL}">${thisURL}</a>`)
  .replace(/%%field-(\w+)%%/g, (match, fieldName) => fieldDocs[fieldName].label)
  .replace(/Example: (http.*)<\/p>/g, `
  <span class="example">
    <a target="_blank" href="$1">$1</a>
  </span>
  </p>
  `)
  .replace(/<p>NOTE: (.*)<\/p>/g, `
  <p class="note">
    $1
  </p>
  `)

const DocumentationWrapper = styled('div')`
code, pre, .example, .note {
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

h1 {
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
}

h1:not(:first-of-type) {
  margin-top: ${props => props.theme.space[5]}px;
}

h2 {
  margin-top: ${props => props.theme.space[4]}px;
}

pre, .example, .note {
  padding: .75rem 1rem;
}

.example {
  position: relative;
  font-family: sans-serif;
  display: block;
  background-color: hsl(205,35%,90%);
  padding-top: 25px;

  overflow: hidden;
  text-overflow: ellipsis;
}

.example::after {
  color: #333;
  position: absolute;
  left: 1rem;
  top: 4px;
  font-family: "SourceSansPro";
  font-weight: bold;
  content: "Example";
}

.note {
  white-space: unset;
  position: relative;
  font-family: sans-serif;
  display: block;
  background-color: #FCF8E3;
  padding-top: 25px;
}

.note::after {
  color: #333;
  position: absolute;
  left: 1rem;
  top: 4px;
  font-family: "SourceSansPro";
  font-weight: bold;
  content: "Note";
}

.example a {
  color: blue;
}

ul, p {
  line-height: 22px;
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

