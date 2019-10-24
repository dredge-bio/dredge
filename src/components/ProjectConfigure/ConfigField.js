"use strict";

const h = require('react-hyperscript')
    , Documentation = require('./Documentation')

module.exports = function ConfigField({
  fieldName,
  label,
  required=false,
  children,
}) {
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
    }),
  ]
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

