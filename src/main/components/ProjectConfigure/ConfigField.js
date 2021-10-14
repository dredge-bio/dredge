"use strict";

const { createElement: h, Fragment } = require('react')
    , Documentation = require('./Documentation')
    , fields = require('./fields')

module.exports = function ConfigField({
  fieldName,
  children,
  setHelpField,
}) {
  const { required, label } = fields[fieldName]

  return (
    h(Fragment, null, [
      h('label', {
        key: `${fieldName}-label`,
        ['data-required']: !!required,
      }, h('span', {
        className: 'label-text',
      }, label)),

      h('div', {
        key: `${fieldName}-field`,
      }, children),

      h(Help, {
        key: `${fieldName}-help`,
        helpField: fieldName,
        setHelpField,
      }),
    ])
  )
}

function Help({
  helpField,
  showHelp,
  setHelpField,
}) {
  return (
    h('div', {
      className: 'help',
    }, ...[
      h('div', {
        className: 'icon',
        tabIndex: 0,
        onClick: () => {
          setHelpField(helpField)
        },
        ['data-field']: helpField,
      }, h('span', { className: 'help' }, '?')),

      (showHelp !== helpField) ? null : (
        h('div', { className: 'help-box' }, ...[
          h(Documentation, { fieldName: helpField }),
        ])
      ),
    ])
  )
}

