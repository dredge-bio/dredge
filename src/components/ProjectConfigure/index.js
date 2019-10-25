"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , debounce = require('debounce')
    , { Flex, Box, Button, Heading } = require('rebass')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default
    , { Navigable, Route } = require('org-shell')
    , { saveAs } = require('file-saver')
    , { readFile } = require('../../utils')
    , Action = require('../../actions')
    , FileInput = require('../util/FileInput')
    , ConfigField = require('./ConfigField')
    , Help = require('./Help')

const ConfigContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  position: relative;
`

const FieldsWrapper = styled(Box)`
display: grid;
grid-template-columns: auto 384px auto;
align-items: center;

grid-row-gap: .7rem;

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
  width: 50px;
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
  width: 100%;
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
    }, () => {
      setTimeout(() => {
        this.setState({ showHelp: null })
      }, 0)
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
        , { config, showHelp } = this.state
        , { setField, setHelpField } = this
        , { resolve, isRelativeURL } = getCanonicalBaseURL(config._baseURL)

    return (
      h(Box, { p: 3 }, [

        h(ConfigContainer, [
          h(Box, [
            h(Flex, {
              alignItems: 'center',
              mb: 4,
            }, [
              h(Heading, {
                as: 'h1',
                fontSize: 5,
                mr: 3,
              }, 'Project configuration'),

              h(Box, {
                //bg: '#ddd',
                style: {
                  // border: '1px solid #999',
                },
              }, [
                /*
                h(Button, {
                  mr: 5,
                  onClick: () => {
                    this.setState(R.always(R.clone(DEFAULT_SETTINGS)), this.persist)
                  },
                }, 'Reset form'),
                */

                h(Button, {
                  mx: 3,
                  style: {
                    padding: '10px 20px',
                    fontSize: 16,
                  },
                  onClick: () => {
                    navigateTo(new Route('test'))
                  },
                }, 'Test'),


                h(FileInput, {
                  mx: 3,
                  style: {
                    padding: '10px 20px',
                    fontSize: 16,
                  },
                  onChange: this.handleLoadConfig,
                }, 'Load'),

                h(Button, {
                  mx: 3,
                  style: {
                    padding: '10px 20px',
                    fontSize: 16,
                  },
                  onClick: () => {
                    const blob = new Blob(
                      [JSON.stringify(this.getProjectJSON(), true, '  ')],
                      { type: 'application/json;charset=utf-8' })

                    saveAs(blob, 'project.json')
                  },
                }, 'Save'),
              ]),
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
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('label'),
                  value: config.label,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'baseURL',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('baseURL'),
                  value: config._baseURL,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'expressionMatrix',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('abundanceMeasures'),
                  value: config.abundanceMeasures,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'treatments',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('treatments'),
                  value: config.treatments,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'pairwiseName',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('pairwiseName'),
                  value: config.pairwiseName,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'maPlot',
                setHelpField,
              }, [
                h(Box, [
                  h('span.axis-label-text', 'X axis'),
                  ' (log₂ Average Transcript Abundance)',
                  h(Flex, { alignItems: 'center', mt: 1, mb: 2 }, [
                    h('span.axis-label-type', 'min'),
                    h(LimitInput, {
                      value: config.abundanceLimits[0][0],
                      onChange: setField(['abundanceLimits', 0, 0], parseFloat),
                    }),

                    h('span.axis-label-type', 'max'),
                    h(LimitInput, {
                      value: config.abundanceLimits[0][1],
                      onChange: setField(['abundanceLimits', 0, 1], parseFloat),
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
                      onChange: setField(['abundanceLimits', 1, 0], parseFloat),
                    }),

                    h('span.axis-label-type', 'max'),
                    h(LimitInput, {
                      value: config.abundanceLimits[1][1],
                      onChange: setField(['abundanceLimits', 1, 1], parseFloat),
                    }),
                  ]),
                ]),
              ]),

              h(ConfigField, {
                fieldName: 'transcriptAliases',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('transcriptAliases'),
                  value: config.transcriptAliases,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'readme',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('readme'),
                  value: config.readme,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'transcriptHyperlink',
                setHelpField,
              }, [
                h(Flex, { alignItems: 'center', mb: 2 }, [
                  h('span.axis-label-text .label-text', 'Label'),
                  h(Box, { flex: 1 }, [
                    h('input', {
                      autoCorrect: 'off',
                      autoCapitalize: 'off',
                      spellCheck: false,
                      type: 'text',
                      value: R.path(['transcriptHyperlink', 0, 'label'], config) || '',
                      onChange: setField(['transcriptHyperlink', 0, 'label']),
                    }),
                  ]),
                ]),

                h(Flex, { alignItems: 'center' }, [
                  h('span.axis-label-text .label-text', 'URL'),
                  h(Box, { flex: 1 }, [
                    h('input', {
                      autoCorrect: 'off',
                      autoCapitalize: 'off',
                      spellCheck: false,
                      type: 'text',
                      value: R.path(['transcriptHyperlink', 0, 'url'], config) || '',
                      onChange: setField(['transcriptHyperlink', 0, 'url']),
                    }),
                  ]),
                ]),
              ]),

              h(ConfigField, {
                fieldName: 'diagram',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('diagram'),
                  value: config.diagram,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'grid',
                setHelpField,
              }, [
                h(Input, {
                  onChange: setField('grid'),
                  value: config.grid,
                }),
              ]),

              h(ConfigField, {
                fieldName: 'heatmapMinimumMaximum',
                setHelpField,
              }, [
                h(Input, {
                  type: 'number',
                  min: 0,
                  step: 1,
                  onChange: setField('heatmapMinimumMaximum'),
                  value: config.heatmapMinimumMaximum,
                }),
              ]),
            ]),
          ]),

          h(Help, {
            config,
            showHelp,
          }),

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
