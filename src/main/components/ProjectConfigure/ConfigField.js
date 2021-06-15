"use strict";

const h = require('react-hyperscript')
    , Documentation = require('./Documentation')
    , fields = require('./fields')

module.exports = function ConfigField({
  fieldName,
  children,
  setHelpField,
}) {
  const { required, label } = fields[fieldName]

  return [
    h('label', {
      key: `${fieldName}-label`,
      ['data-required']: !!required,
    }, [
      h('span.label-text', label),
    ]),

    h('div', {
      key: `${fieldName}-field`,
    }, children),

    h(Help, {
      key: `${fieldName}-help`,
      helpField: fieldName,
      setHelpField,
    }),
  ]
}

function Help({
  helpField,
  showHelp,
  setHelpField,
}) {
  return (
    h('div.help', [
      h('.icon', {
        tabIndex: 0,
        onClick: () => {
          setHelpField(helpField)
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

