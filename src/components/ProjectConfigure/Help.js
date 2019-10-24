"use strict";

const h = require('react-hyperscript')

module.exports = function Help({
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

