"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default

function Status({ status }) {
  return status.case({
    Pending: () => h('span', '...'),
    Failed: () => h('span', '✖'),
    Missing: () => h('span', '--'),
    OK: () => h('span', '✔'),
  })
}

const LogProject = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  margin-bottom: 2em;

  .--label {
    font-weight: bold;
    grid-column: span 2;
  }

  span {
    padding: 0 6px 0 10px;
  }
`

function Log({ log }) {
  const projectLogs = R.omit([''], log)
      , notProjectLog = (log[''] || {})

  return (
    h('div', [
      h('h2', 'Log'),

      Object.entries(projectLogs).map(([ projectURL, files ]) =>
        h(LogProject, {
          key: projectURL,
        }, [
          h('div.--label', [
            projectURL,
          ]),

          Object.values(files).map(({ url, label, status }) => [
            h(Status, { key: `${label}-status`, status }),
            h('div', { key: `${label}-label` }, [
              h('div', label),
              status.case({
                Failed: message => !message ? null : h('div', {
                  style: {
                    color: 'red',
                  },
                }, message),
                _: R.always(null),
              }),
            ]),
          ])
        ])
      ),
    ])
  )
}

module.exports = connect(R.pick(['log']))(Log)
