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
    , { readFile } = require('../../utils')
    , Action = require('../../actions')
    , FileInput = require('../util/FileInput')
    , Documentation = require('./Documentation')
    , ConfigTree = require('./ConfigTree')

const DocBox = styled(Box)`
  max-width: 640px;
`

const FieldsWrapper = styled(Box)`
display: grid;
grid-template-columns: auto auto auto;
align-items: center;

grid-row-gap: 1rem;

> label {
  justify-self: right;
  white-space: nowrap;
  margin-right: 10px;
}

.help .icon {
  width: 24px;
  height: 24px;
  font-size: 18px;
  background-color: hsl(205, 45%, 35%);
  color: white;
  font-weight: bold;

  border-radius: 12px;

  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;

  text-selection: none;
  cursor: pointer;

  :hover {
    background-color: hsl(205, 65%, 50%);
  }
}

.help {
  align-self: stretch;
  display: flex;
  align-items: center;
  position: relative;
}

.help-box {
  position: absolute;
  border: 2px solid #666;
  left: 100%;
  margin-left: 10px;
  padding: 16px;
  background-color: white;
  width: 640px;
}

.help-box::after {
  content: " ";
  position: absolute;
  left: -10px;
  top: calc(50% - 10px);
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid #666;
}

[data-required=true] span::after {
  content: "*";
  font-size: 20px;
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
  font-family: "SourceSansPro", sansserif;
  display: inline-block;
  font-weight: bold;
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
  const {
    showURL,
    isRelativeURL,
    helpField,
    showHelp,
    showHelpText,
    hideHelpText,
  } = props

  const innerProps = R.omit([
    'children',
    'help',
    'label',
    'required',
    'showURL',
    'isRelativeURL',
    'onHelpChange',
    'showHelp',
  ], props)

  const replaceRelative = showURL && isRelativeURL && showURL.startsWith(window.location.origin)

  return [
    h('label', {
      key: 'label',
      ['data-required']: !!props.required,
    }, [
      h('span.label-text', props.label),
    ]),

    h('input', Object.assign({
      key: 'input',
      type: 'text',
      autoCorrect: 'off',
      autoCapitalize: 'off',
      spellCheck: false,
    }, innerProps)),

    !helpField ? h('div') : h(Help, {
      helpField,
      showHelpText,
      hideHelpText,
      showHelp,
    }),
  ]
}

/*
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
    ])
  )
}
*/

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

function Help({
  helpField,
  showHelp,
  showHelpText,
  hideHelpText,
}) {
  return (
    h('div.help', [
      h('.icon', {
        tabIndex: 0,
        onClick: () => {
          if (showHelp === helpField) {
            hideHelpText()
          } else {
            showHelpText()
          }
        },
        ['data-field']: helpField,
      }, [
        h('span.help', '?'),
      ]),

      (showHelp !== helpField) ? null : (
        h('.help-box', [
          h(Documentation, { fieldName: helpField }),
        ])
      ),
    ])
  )
}

class NewProject extends React.Component {
  constructor(props) {
    super(props);
    this.setField = this.setField.bind(this)
    this.setHelpField = this.setHelpField.bind(this)

    this.state = {
      config: props.config,
      showHelp: null,
      preventHideHelp: false,
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

  setHelpField(fieldName) {
    this.setState(prev => {
      if (prev.showHelp === fieldName) return prev

      return Object.assign({}, prev, {
        showHelp: fieldName,
        preventHideHelp: false,
      })
    })
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

    const inputFields = field => ({
      helpField: field,
      showHelpText: () => this.setHelpField(field),
      hideHelpText: () => this.setHelpField(null),
      showHelp: this.state.showHelp,
    })

    return (
      h(Box, { p: 3 }, [
        h(Heading, { as: 'h1', fontSize: 5, mb: 3 }, 'New project'),

        h(Flex, [

          h(Box, { flex: 1 }, [
            h(DocBox, [
              h(Heading, { as: 'h2', mb: 2, fontSize: 4 }, 'Configuration'),

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

              h(FieldsWrapper, {
                onKeyDown: e => {
                  if (e.key === 'Enter') {
                    const { field } = e.target.dataset

                    if (field) {
                      this.setHelpField(field)
                    }
                  }
                },
              }, [
                h(Input, {
                  label: 'Project name',
                  required: true,
                  onChange: this.setField('label'),
                  showHelp: this.state.showHelp,
                  value: config.label,
                }),

                h(Input, Object.assign(inputFields('baseURL'), {
                  label: 'Configuration file directory',
                  required: true,
                  onChange: this.setField('baseURL'),
                  value: config._baseURL,
                  showURL: resolve(''),
                  isRelativeURL,
                })),

                h(Input, Object.assign(inputFields('expressionMatrix'), {
                  label: 'Gene expression matrix URL',
                  required: true,
                  onChange: this.setField('abundanceMeasures'),
                  value: config.abundanceMeasures,
                  showURL: config.abundanceMeasures && resolve(config.abundanceMeasures),
                  isRelativeURL,
                })),



                h(Input, Object.assign(inputFields('treatments'), {
                  label: 'Treatment information URL',
                  required: true,
                  onChange: this.setField('treatments'),
                  value: config.treatments,
                  showURL: config.treatments && resolve(config.treatments),
                  isRelativeURL,
                })),

                h(Input, Object.assign(inputFields('pairwiseName'), {
                  label: 'Pairwise comparison URL template',
                  required: true,
                  onChange: this.setField('pairwiseName'),
                  value: config.pairwiseName,
                  showURL: config.pairwiseName && resolve(config.pairwiseName),
                  isRelativeURL,
                })),

                h('label', [
                  h('span.label-text', 'MA plot limits'),
                ]),

                h(Box, [
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
                ]),

                h(Help, Object.assign(inputFields('maPlot'))),

                h(Input, Object.assign(inputFields('transcriptAliases'), {
                  label: 'Transcript aliases URL',
                  onChange: this.setField('transcriptAliases'),
                  value: config.transcriptAliases,
                  showURL: config.transcriptAliases && resolve(config.transcriptAliases),
                  isRelativeURL,
                })),

                h(Input, Object.assign(inputFields('readme'), {
                  label: 'Project documentation',
                  required: false,
                  onChange: this.setField('readme'),
                  value: config.readme,
                  showURL: config.readme && resolve(config.readme),
                  isRelativeURL,
                })),

                h('label', [
                  h('span.label-text', 'Transcript hyperlink template'),
                ]),

                h(Box, [
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
                ]),

                h(Help, Object.assign(inputFields('transcriptHyperlink'))),

                h(Input, {
                  label: 'Diagram URL',
                  onChange: this.setField('diagram'),
                  showHelp: this.state.showHelp,
                  onHelpChange: this.setHelpField,
                  getPreventHideHelp: () => this.state.preventHideHelp,
                  setPreventHideHelp: () => this.setState({ preventHideHelp: true }),
                  helpField: 'diagram',
                  value: config.diagram,
                  showURL: config.diagram && resolve(config.diagram),
                  isRelativeURL,
                }),

                h(Input, Object.assign(inputFields('grid'), {
                  label: 'Grid URL',
                  onChange: this.setField('grid'),
                  value: config.grid,
                  showURL: config.grid && resolve(config.grid),
                  isRelativeURL,
                })),

                h(Input, Object.assign(inputFields('heatmapMinimumMaximum'), {
                  type: 'number',
                  min: 0,
                  step: 1,
                  label: 'Minimum heatmap abundance',
                  onChange: this.setField('heatmapMinimumMaximum', parseInt),
                  value: config.heatmapMinimumMaximum,
                })),
              ]),
            ]),
          ]),

          h(Card, {
            flex: 1,
            ml: 4,
            pl: 4,
            borderLeft: 1,
            borderColor: '#ccc',
          }, [
            h(DocBox, [
              h(Box, { as: 'h2', mt: 3, mb: 2 }, 'Expected project layout'),

              h(ConfigTree, { config }),

              /*
              h(Documentation, { fieldName: 'instructions' }),

              h(Box, { as: 'h3', mt: 3, mb: 2 }, 'Video tutorial'),

              h('iframe', {
                src: 'https://player.vimeo.com/video/336692169',
                frameBorder: "0",
                width: '100%',
                height: '400',
                allow: 'fullscreen',
                allowFullScreen: true,
                style: {
                  border: '2px solid #333',
                },
              }),
              */
            ]),
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
