"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Heading } = require('rebass')
    , styled = require('styled-components').default

const Field = styled(Box)`
&[data-required=true] label span::after {
  content: "*";
  font-size: 14px;
  margin-left: 1px;
  margin-top: -1px;
  position: absolute;
  color: red;
}

.help-text {
  color: #666;
  width: 600px;
  line-height: 19px;
}

.help-text code {
  font-family: monospace;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: black;
  white-space: nowrap;
  padding: 2px 6px;
}

.resolved-url-link * {
  font-family: monospace;
  font-size: 14px;
}

.label-text {
  display: inline-block;
  font-weight: bold;
  margin-bottom: 4px;
}

input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  width: 384px;
}

.resolved-url {
  font-size: 14px;
}

.resolved-url-label {
  font-weight: bold;
  display: inline-block;
  margin-right: 4px;
}

.relative-url-base {
  color: #333;
}

.resolved-url a {
  color: blue;
  text-decoration: none;
}
`

function resolveURL(base, path) {
  try {
    return new URL(path, base).href
  } catch (e) {
    return null
  }
}

function Input(props) {
  const { showURL, isRelativeURL } = props

  const innerProps = R.omit([
    'children',
    'help',
    'label',
    'required',
    'showURL',
    'isRelativeURL',
  ], props)

  const replaceRelative = showURL && isRelativeURL && showURL.startsWith(window.location.origin)

  return (
    h(Field, { mb: 4, ['data-required']: !!props.required }, [
      h('label', {}, [].concat(
        h('span.label-text', props.label),
        h('br'),
        h('input', Object.assign({ type: 'text' }, innerProps))
      )),

      !props.showURL ? null : (
        h(Box, { className: 'resolved-url', my: 2 }, [
          h('span.resolved-url-label', 'Resolved URL: '),
          h('span.resolved-url-link', [
            !replaceRelative ? null : (
              h('span.relative-url-base', new URL('./', window.location.href).href)
            ),
            h('a', { href: showURL, target: '_blank' }, replaceRelative
              ? showURL.replace(new URL('./', window.location.href).href, '')
              : showURL
            ),
          ]),
        ])
      ),

      !props.help ? null : (
        h(Box, { mt: 1, className: 'help-text' }, typeof props.help === 'string'
          ? h('p', props.help)
          : props.help
        )
      )
    ])
  )
}

module.exports = class NewProject extends React.Component {
  constructor() {
    super();

    this.setField = this.setField.bind(this)

    this.state = {
      baseURL: '',
      label: '',
      url: '',
      readme: '',
      abundanceLimits: [
        [0, 100],
        [0, 100],
      ],
      treatments: './treatments.json',
      pairwiseName: './pairwise_data/%A_%B.txt',
      transcriptAliases: './aliases.txt',
      abundanceMeasures: './abundanceMeasures.txt',
      diagram: './diagram.svg',
    }
  }

  setField(fieldName, fn=R.identity) {
    return e => {
      this.setState({ [fieldName]: fn(e.target.value) })
    }
  }

  render() {
    let isRelativeURL = false

    let baseURL = this.state.baseURL

    if (!baseURL.startsWith('http')) {
      isRelativeURL = true
      baseURL = resolveURL(window.location.href, baseURL || './')
    }

    if (!baseURL.endsWith('/')) baseURL += '/'

    const resolve = path => resolveURL(baseURL, path, baseURL)

    return (
      h(Box, { p: 3 }, [
        h(Heading, { as: 'h1', fontSize: 5 }, 'New project'),

        h(Heading, { as: 'h2', mb: 2, mt: 3 }, 'Basics'),

        h(Box, [
          h(Input, {
            label: 'Project name',
            required: true,
            onChange: this.setField('label'),
            value: this.state.label,
          }),

          h(Input, {
            label: 'Root URL',
            help: 'The URL that will be the basis for all further URLs. If this value is not an absolute URL, it will be resolved relative to the page on which DrEdGE is hosted.',
            required: true,
            onChange: this.setField('baseURL'),
            value: this.state.baseURL,
            showURL: resolve(''),
            isRelativeURL,
          }),

          h(Input, {
            label: 'Treatments URL',
            help: 'The URL that contains information about individual treatments in the dataset',
            required: true,
            onChange: this.setField('treatments'),
            value: this.state.treatments,
            showURL: this.state.treatments && resolve(this.state.treatments),
            isRelativeURL,
          }),
        ]),

        h(Heading, { as: 'h2', mb: 2, mt: 5 }, 'Configuration'),

        h(Box, [
          h(Input, {
            label: 'Pairwise comparison URL template',
            help: h(Box, [
              h(Box, { as: 'p', mb: 2 }, 'A template to generate the URLs to pairwise comparison data. The characters \'%A\' will be replaced with the name of the first treatment, and \'%B\' the second.'),
              h('p', [
                'For example: If my dataset contained the pairwise comparison for treatments T1 and T2 in the directory ',
                h('code', 'pairwise_tests/T1-T2.csv'),
                ' the value in this field would be ',
                h('code', 'pairwise_tests/%A-%B.csv'),
              ]),
            ]),
            onChange: this.setField('pairwiseName'),
            value: this.state.pairwiseName,
            showURL: this.state.pairwiseName && resolve(this.state.pairwiseName),
            isRelativeURL,
          }),

          h(Input, {
            label: 'Transcript aliases URL',
            help: 'The URL that contains information about alternate names for transcripts in the dataset. This should be a CSV file whose first column contains the canonical label for a transcript, and whose other columns contain alternate names.',
            onChange: this.setField('transcriptAliases'),
            value: this.state.transcriptAliases,
            showURL: this.state.transcriptAliases && resolve(this.state.transcriptAliases),
            isRelativeURL,
          }),

          h(Input, {
            label: 'Abundance measures URL',
            help: 'The URL of the file containing abundance measures for each transcript by treatement.',
            onChange: this.setField('abundanceMeasures'),
            value: this.state.abundanceMeasures,
            showURL: this.state.abundanceMeasures && resolve(this.state.abundanceMeasures),
            isRelativeURL,
          }),

          h(Input, {
            label: 'Diagram URL',
            help: 'The URL of the SVG diagram for this project',
            onChange: this.setField('diagram'),
            value: this.state.diagram,
            showURL: this.state.diagram && resolve(this.state.diagram),
            isRelativeURL,
          }),
        ]),
      ])
    )
  }
}
