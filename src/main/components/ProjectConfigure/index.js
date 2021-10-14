"use strict";

const { createElement: h } = require('react')
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
  grid-template-rows: calc(100vh - 64px);
  position: relative;
  overflow-x: hidden;

  > div {
    overflow-y: scroll;
  }

  > div:nth-child(2) {
    background-color: #fcfcfc;
  }
`

const FieldsWrapper = styled(Box)`
display: grid;
grid-template-columns: auto 384px auto;
align-items: center;

@media (max-width: 1220px) {
  grid-template-columns: auto 200px auto;
}

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

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
   opacity: 1;
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
  width: 72px;
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
          , update = R.set(lens, val)

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
    let ret = JSON.parse(JSON.stringify(this.state.config))

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

    return (
      h(ConfigContainer, null, ...[
        h(Box, {
          py: 3,
          px: 4,
          style: {
            overflowY: 'auto',
          },
        }, ...[
          h(Box, {
            alignItems: 'center',
          }, ...[
            h(Heading, {
              as: 'h1',
              fontSize: 5,
              mr: 3,
              mb: 3,
            }, 'Project configuration'),

            h(Box, {
              //bg: '#ddd',
              mb: 3,
              pb: 3,
              style: {
                borderBottom: '1px solid #ccc',
                // border: '1px solid #999',
              },
            }, ...[
              /*
              h(Button, {
                mr: 5,
                onClick: () => {
                  this.setState(R.always(R.clone(DEFAULT_SETTINGS)), this.persist)
                },
              }, 'Reset form'),
              */

              h(Button, {
                mr: 2,
                style: {
                  padding: '10px 20px',
                  fontSize: 16,
                },
                onClick: () => {
                  navigateTo(new Route('test'))
                },
              }, 'Test'),


              h(FileInput, {
                mx: 2,
                style: {
                  padding: '10px 20px',
                  fontSize: 16,
                },
                onChange: this.handleLoadConfig,
              }, 'Load'),

              h(Button, {
                mx: 2,
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
          }, ...[
            h(ConfigField, {
              fieldName: 'label',
              setHelpField,
            }, ...[
              h(Input, {
                onChange: setField('label'),
                value: config.label,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'treatments',
              setHelpField,
            }, ...[
              h(Input, {
                onChange: setField('treatments'),
                value: config.treatments,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'expressionMatrix',
              setHelpField,
            }, ...[
              h(Input, {
                onChange: setField('abundanceMeasures'),
                value: config.abundanceMeasures,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'pairwiseName',
              setHelpField,
            }, ...[
              h(Input, {
                onChange: setField('pairwiseName'),
                value: config.pairwiseName,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'maPlot',
              setHelpField,
            }, [
              h(Box, null, ...[
                h('span', {
                  className: 'axis-label',
                }, 'X axis'),
                ' (log₂ Average Transcript Abundance)',

                h(Flex, { alignItems: 'center', mt: 1, mb: 2 }, ...[
                  h('span', {
                    className: 'axis-label-type',
                  }, 'min'),

                  h(LimitInput, {
                    value: config.abundanceLimits[0][0],
                    onChange: setField(['abundanceLimits', 0, 0], parseFloat),
                  }),

                  h('span', {
                    className: 'axis-label-type',
                  }, 'max'),

                  h(LimitInput, {
                    value: config.abundanceLimits[0][1],
                    onChange: setField(['abundanceLimits', 0, 1], parseFloat),
                  }),
                ]),
              ]),

              h(Box, null, ...[
                h('span', {
                  className: 'axis-label-text',
                }, 'Y axis'),

                ' (log₂ Fold Change)',

                h(Flex, { alignItems: 'center', mt: 1, mb: 2 }, ...[
                  h('span', {
                    className: 'axis-label-type',
                  }, 'min'),

                  h(LimitInput, {
                    value: config.abundanceLimits[1][0],
                    onChange: setField(['abundanceLimits', 1, 0], parseFloat),
                  }),

                  h('span', {
                    className: 'axis-label-type',
                  }, 'max'),

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
            }, ...[
              h(Input, {
                onChange: setField('transcriptAliases'),
                value: config.transcriptAliases,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'readme',
              setHelpField,
            }, ...[
              h(Input, {
                onChange: setField('readme'),
                value: config.readme,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'transcriptHyperlink',
              setHelpField,
            }, ...[
              h(Flex, { alignItems: 'center', mb: 2 }, ...[
                h('span', {
                  className: 'axis-label-text label-text',
                }, 'Label'),

                h(Box, { flex: 1 }, ...[
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

              h(Flex, { alignItems: 'center' }, ...[
                h('span', {
                  className: 'axis-label-text label-text',
                }, 'URL'),

                h(Box, { flex: 1 }, ...[
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
            }, ...[
              h(Input, {
                onChange: setField('diagram'),
                value: config.diagram,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'grid',
              setHelpField,
            }, ...[
              h(Input, {
                onChange: setField('grid'),
                value: config.grid,
              }),
            ]),

            h(ConfigField, {
              fieldName: 'heatmapMinimumMaximum',
              setHelpField,
            }, ...[
              h(Box, {
                as: 'span',
                style: {
                  background: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px 0 0 4px',
                  padding: '8px',
                  paddingRight: '6px',
                  fontSize: '14px',
                  marginRight: '-2px',
                  borderRight: 'none',
                },
              }, '0 ‒'),

              h(Input, {
                style: {
                  fontSize: '14px',
                  borderRadius: '0 4px 4px 0',
                  borderLeft: 'none',
                  paddingLeft: '3px',
                  width: '96px',
                },
                type: 'number',
                min: 0,
                step: 1,
                onChange: setField('heatmapMinimumMaximum'),
                value: config.heatmapMinimumMaximum,
              }),
            ]),
          ]),
        ]),

        h(Box, null, ...[
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
  }))
)(NewProject)
