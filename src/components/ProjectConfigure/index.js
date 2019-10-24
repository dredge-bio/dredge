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
    , ConfigField = require('./ConfigField')
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
  return (
    h('input', Object.assign({
      key: 'input',
      type: 'text',
      autoCorrect: 'off',
      autoCapitalize: 'off',
      spellCheck: false,
    }, props))
  )
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

/*
    const inputFields = field => ({
      helpField: field,
      showHelpText: () => this.setHelpField(field),
      hideHelpText: () => this.setHelpField(null),
      showHelp: this.state.showHelp,
    })
    */

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
                h(ConfigField, {
                  fieldName: 'label',
                  label: 'Project name',
                  required: true,
                }, [
                  h(Input, {
                    onChange: this.setField('label'),
                    value: config.label,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'baseURL',
                  label: 'Configuration file directory',
                  required: true,
                }, [
                  h(Input, {
                    onChange: this.setField('baseURL'),
                    value: config._baseURL,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'expressionMatrix',
                  label: 'Gene expression matrix URL',
                  required: true,
                }, [
                  h(Input, {
                    onChange: this.setField('abundanceMeasures'),
                    value: config.abundanceMeasures,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'treatments',
                  label: 'Treatment information URL',
                  required: true,
                }, [
                  h(Input, {
                    onChange: this.setField('treatments'),
                    value: config.treatments,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'pairwiseName',
                  label: 'Pairwise comparison URL template',
                  required: true,
                }, [
                  h(Input, {
                    onChange: this.setField('pairwiseName'),
                    value: config.pairwiseName,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'maPlot',
                  label: 'MA plot limits',
                }, [
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

                h(ConfigField, {
                  fieldName: 'transcriptAliases',
                  label: 'Transcript aliases URL',
                }, [
                  h(Input, {
                    onChange: this.setField('transcriptAliases'),
                    value: config.transcriptAliases,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'readme',
                  label: 'Project documentation',
                }, [
                  h(Input, {
                    onChange: this.setField('readme'),
                    value: config.readme,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'transcriptHyperlink',
                  label: 'Transcript hyperlink template',
                }, [
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

                h(ConfigField, {
                  fieldName: 'diagram',
                  label: 'Diagram URL',
                }, [
                  h(Input, {
                    onChange: this.setField('diagram'),
                    value: config.diagram,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'grid',
                  label: 'Grid URL',
                }, [
                  h(Input, {
                    onChange: this.setField('grid'),
                    value: config.grid,
                  }),
                ]),

                h(ConfigField, {
                  fieldName: 'heatmapMinimumMaximum',
                  label: 'Minimum heatmap abundance',
                }, [
                  h(Input, {
                    type: 'number',
                    min: 0,
                    step: 1,
                    onChange: this.setField('heatmapMinimumMaximum'),
                    value: config.heatmapMinimumMaximum,
                  }),
                ]),
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
