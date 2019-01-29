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
  margin-top: 1rem;

  .-label {
    padding-right: .5em;
  }

  .-message {
    padding-top: 1px;
    margin-top: -.2em;
    margin-left: 24px;
    grid-column: span 3;
  }

  .-grid {
    display: grid;
    align-items: center;
    grid-template-columns: 24px auto 1fr;
    row-gap: 2px;
    margin-left: .5rem;
  }
`

function Log({ infoLog, logsByProject }) {
  return (
    h('div', {
      style: {
        padding: '.5em 1.33em',
      },
    }, [
      h('h2', 'Log'),

      logsByProject.map(({ baseURL, label, files }) =>
        h(LogProject, {
          key: baseURL,
        }, [
          h('h3', [
            label,
          ]),

          h('div.-grid', [
            Object.values(files).map(({ url, label, status }) => [
              h(Status, { key: `${label}-status`, status }),

              h('div.-label', { key: `${label}-label` }, [
                label,
              ]),

              h('div', [
                h('a', {
                  href: url,
                  style: {
                    color: '#666',
                    fontSize: '80%',
                  },
                }, url),
              ]),

              h('div.-message', [
                status.case({
                  Failed: message => !message ? null : h('div', {
                    style: {
                      color: 'red',
                    },
                  }, [
                    h('b', 'Error: '),
                    message,
                  ]),
                  _: R.always(null),
                }),
              ]),
            ]),
          ]),
        ])
      ),
    ])
  )
}

module.exports = connect(state => {
  const projectLogs = R.omit([''], state.log) || {}
      , infoLog = (state.log[''] || {})

  const logsByProject = Object.entries(projectLogs).map(([ baseURL, files ]) => ({
    baseURL,
    label: R.path(['projects', baseURL, 'metadata', 'label'], state) || baseURL,
    files,
  }))

  return {
    infoLog,
    logsByProject,
  }
})(Log)
