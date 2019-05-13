"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , debounce = require('debounce')
    , { Flex, Box, Card, Button, Heading } = require('rebass')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default
    , { Navigable, Route } = require('org-shell')
    , { saveAs } = require('file-saver')
    , { readFile } = require('../utils')
    , Action = require('../actions')
    , Documentation = require('./Documentation')
    , FileInput = require('./util/FileInput')

const Field = styled(Box)`
&[data-required=true] label span::after {
  content: "(required)";
  font-size: 12px;
  position: relative;
  left: 4px;
  bottom: 2px;
  color: red;
}

.help-text {
  color: #666;
  max-width: 640px;
}

.resolved-url-link * {
  font-family: monospace;
  font-size: 12px;
}

.label-text {
  display: inline-block;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 4px;
}

.axis-label-text {
  font-weight: bold;
}

.axis-label-type {
  margin-right: 2px;
}

input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

input[type="text"] {
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

const LimitInputContainer = styled(Box)`
  width: 64px;
  margin-right: 8px;
`

function LimitInput({ value, onChange }) {
  return h(LimitInputContainer, {
    as: 'input',
    type: 'number',
    value,
    onChange,
  })
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
      h('label', [
        h('span.label-text', props.label),
        h('br'),
        h('input', Object.assign({
          type: 'text',
          autoCorrect: 'off',
          autoCapitalize: 'off',
          spellCheck: false,
        }, innerProps)),
      ]),

      (!props.showURL || props.label === 'Configuration file directory') ? null : (
        h(Box, { className: 'resolved-url', my: 2 }, [
          h('span.resolved-url-label', 'Expected location: '),
          h('span.resolved-url-link', [
            !replaceRelative ? null : (
              h('span.relative-url-base', './')
            ),
            h('a', { href: showURL, target: '_blank' }, replaceRelative
              ? showURL.replace(new URL('./', window.location.href).href, '')
              : showURL
            ),
          ]),
        ])
      ),

      props.label !== 'Configuration file directory' ? null : (
        h(Box, { className: 'resolved-url', my: 2 }, [
          h('span.resolved-url-label', 'Expected configuration location: '),
          h('span.resolved-url-link', [
            !replaceRelative ? null : (
              h('span.relative-url-base', './')
            ),
            h('a', { href: showURL + 'project.json', target: '_blank' }, (replaceRelative
              ? showURL.replace(new URL('./', window.location.href).href, '')
              : showURL) + 'project.json'
            ),
          ]),
        ])
      ),

      !props.documentation ? null : (
        h(Documentation, { fieldName: props.documentation })
      ),

      /*
      !props.help ? null : (
        h(Box, { mt: 1, className: 'help-text' }, typeof props.help === 'string'
          ? h('p', props.help)
          : props.help
        )
      ),
      */
    ])
  )
}

function getCanonicalBaseURL(_baseURL) {
  let baseURL = _baseURL
    , isRelativeURL

  if (!baseURL.startsWith('http')) {
    isRelativeURL = true
    baseURL = resolveURL(window.location.href, baseURL || './')
  }

  if (!baseURL.endsWith('/')) baseURL += '/'

  const resolve = path => resolveURL(baseURL, path, baseURL)

  return { isRelativeURL, baseURL, resolve }
}

class NewProject extends React.Component {
  constructor(props) {
    super(props);
    this.setField = this.setField.bind(this)

    this.state = {
      config: props.config,
    }

    this.persistChanges = debounce(this.persistChanges.bind(this), 200)
    this.handleLoadConfig = this.handleLoadConfig.bind(this)
  }

  setField(fieldName, fn=R.identity) {
    const lens = R.lensPath(['config'].concat(fieldName))

    return e => {
      const val = fn(e.target.value)

      const update = fieldName !== 'baseURL'
        ? R.set(lens, val)
        : R.pipe(
          R.set(R.lensPath(['config', '_baseURL']), val),
          R.set(lens, getCanonicalBaseURL(val).baseURL))

      this.setState(update, this.persistChanges)
    }
  }

  persistChanges() {
    const { dispatch } = this.props
        , { config } = this.state

    dispatch(Action.UpdateLocalConfig(R.assoc('config', config)))
  }

  getProjectJSON() {
    let ret = R.omit(['baseURL', '_baseURL'], this.state.config)

    ret = R.over(
      R.lensProp('transcriptHyperlink'),
      R.filter(val => val.label && val.url.includes('%name')),
      ret
    )

    if (!ret.transcriptHyperlink.length) {
      ret = R.omit(['transcriptHyperlink'], ret)
    }

    return ret
  }

  async handleLoadConfig(e) {
    const { files } = e.target

    if (files.length) {
      const text = await readFile(files[0])
          , newConfig = JSON.parse(text)

      this.setState(prev => ({
        config: Object.assign({}, prev.config, newConfig),
      }), this.persistChanges)
    }
  }

  render() {
    const { navigateTo } = this.props
        , { config } = this.state
        , { resolve, isRelativeURL } = getCanonicalBaseURL(config._baseURL)

    return (
      h(Box, { p: 3 }, [
        h(Heading, { as: 'h1', fontSize: 5 }, 'New project'),

        h(Box, { my: 3 }, [
          /*
          h(Button, {
            mr: 5,
            onClick: () => {
              this.setState(R.always(R.clone(DEFAULT_SETTINGS)), this.persist)
            },
          }, 'Reset form'),
          */

          h(Button, {
            mr: 5,
            onClick: () => {
              navigateTo(new Route('test'))
            },
          }, 'Test'),


          h(FileInput, {
            onChange: this.handleLoadConfig,
          }, 'Load'),

          h(Button, {
            mr: 2,
            onClick: () => {
              const blob = new Blob(
                [JSON.stringify(this.getProjectJSON(), true, '  ')],
                { type: 'application/json;charset=utf-8' })

              saveAs(blob, 'project.json')
            },
          }, 'Save'),
        ]),

        h(Flex, [
          h(Box, { flex: 1 }, [
            h(Heading, { as: 'h2', mb: 2 }, 'Configuration'),

            h(Input, {
              label: 'Project name',
              required: true,
              onChange: this.setField('label'),
              value: config.label,
            }),

            h(Input, {
              label: 'Configuration file directory',
              documentation: 'baseURL',
              required: true,
              onChange: this.setField('baseURL'),
              value: config._baseURL,
              showURL: resolve(''),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Gene expression matrix URL',
              required: true,
              documentation: 'expressionMatrix',
              onChange: this.setField('abundanceMeasures'),
              value: config.abundanceMeasures,
              showURL: config.abundanceMeasures && resolve(config.abundanceMeasures),
              isRelativeURL,
            }),



            h(Input, {
              label: 'Treatment information URL',
              documentation: 'treatments',
              required: true,
              onChange: this.setField('treatments'),
              value: config.treatments,
              showURL: config.treatments && resolve(config.treatments),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Pairwise comparison URL template',
              required: true,
              documentation: 'pairwiseName',
              onChange: this.setField('pairwiseName'),
              value: config.pairwiseName,
              showURL: config.pairwiseName && resolve(config.pairwiseName),
              isRelativeURL,
            }),

            h(Field, { mb: 4 }, [
              h('label', [
                h('span.label-text', 'MA plot limits'),
              ]),

              h(Box, [
                h('span.axis-label-text', 'X axis'),
                ' (log₂ Average Transcript Abundance)',
                h(Flex, { alignItems: 'center', mt: 1, mb: 2 }, [
                  h('span.axis-label-type', 'min'),
                  h(LimitInput, {
                    value: config.abundanceLimits[0][0],
                    onChange: this.setField(['abundanceLimits', 0, 0], parseFloat),
                  }),

                  h('span.axis-label-type', 'max'),
                  h(LimitInput, {
                    value: config.abundanceLimits[0][1],
                    onChange: this.setField(['abundanceLimits', 0, 1], parseFloat),
                  }),
                ]),
              ]),

              h(Box, [
                h('span.axis-label-text', 'Y axis'),
                ' (log₂ Fold Change)',
                h(Flex, { alignItems: 'center', mt: 1, mb: 2 }, [
                  h('span.axis-label-type', 'min'),
                  h(LimitInput, {
                    value: config.abundanceLimits[1][0],
                    onChange: this.setField(['abundanceLimits', 1, 0], parseFloat),
                  }),

                  h('span.axis-label-type', 'max'),
                  h(LimitInput, {
                    value: config.abundanceLimits[1][1],
                    onChange: this.setField(['abundanceLimits', 1, 1], parseFloat),
                  }),
                ]),
              ]),

              h(Documentation, { fieldName: 'maPlot' }),
            ]),

            h(Input, {
              label: 'Transcript aliases URL',
              documentation: 'transcriptAliases',
              onChange: this.setField('transcriptAliases'),
              value: config.transcriptAliases,
              showURL: config.transcriptAliases && resolve(config.transcriptAliases),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Project documentation',
              documentation: 'readme',
              required: false,
              onChange: this.setField('readme'),
              value: config.readme,
              showURL: config.readme && resolve(config.readme),
              isRelativeURL,
            }),

            h(Field, { mb: 4 }, [
              h('label', [
                h('span.label-text', 'Transcript hyperlink template'),
              ]),

              h(Box, [
                h('span.axis-label-text', 'Hyperlink label'),
                h(Box, { mt: 1, mb: 2 }, [
                  h('input', {
                    autoCorrect: 'off',
                    autoCapitalize: 'off',
                    spellCheck: false,
                    type: 'text',
                    value: R.path(['transcriptHyperlink', 0, 'label'], config) || '',
                    onChange: this.setField(['transcriptHyperlink', 0, 'label']),
                  }),
                ]),
              ]),

              h(Box, [
                h('span.axis-label-text', 'URL'),
                h(Box, { mt: 1, mb: 2 }, [
                  h('input', {
                    autoCorrect: 'off',
                    autoCapitalize: 'off',
                    spellCheck: false,
                    type: 'text',
                    value: R.path(['transcriptHyperlink', 0, 'url'], config) || '',
                    onChange: this.setField(['transcriptHyperlink', 0, 'url']),
                  }),
                ]),
              ]),

              h(Documentation, { fieldName: 'transcriptHyperlink' }),
            ]),

            h(Input, {
              label: 'Diagram URL',
              onChange: this.setField('diagram'),
              documentation: 'diagram',
              value: config.diagram,
              showURL: config.diagram && resolve(config.diagram),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Grid URL',
              onChange: this.setField('grid'),
              documentation: 'grid',
              value: config.grid,
              showURL: config.grid && resolve(config.grid),
              isRelativeURL,
            }),
          ]),

          h(Card, {
            flex: 1,
            ml: 4,
            pl: 4,
            borderLeft: 1,
            borderColor: '#ccc',
          }, [
            h(Documentation, { fieldName: 'instructions' }),
          ]),
        ]),
      ])
    )
  }
}

module.exports = R.pipe(
  Navigable,
  connect(state => ({
    config: state.projects.local.config,
    baseURL: state.projects.local.baseURL,
  }))
)(NewProject)
