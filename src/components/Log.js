"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default
    , LoadingIcon = require('./LoadingIcon')

const IconWrapper = styled.span`
  svg {
  }
`

function Status({ status, indent }) {
  const content = status.case({
    Pending: () => h(IconWrapper, {}, h(LoadingIcon)),
    Failed: () => '✖',
    Missing: () => '--',
    OK: () => '✔',
  })

  return h('span', {
    style: {
      whiteSpace: 'nowrap',
      marginLeft: indent ? '24px' : 0,
    },
  }, content)
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
    grid-template-columns: 18px auto 1fr;
    row-gap: 2px;
    margin-left: .5rem;
  }
`

function Log({ infoLog, initializing, failedProject, loadingProject, logsByProject }) {
  let label = 'Log'

  if (initializing) {
    label = 'Initializing...'
  } else if (failedProject) {
    label = 'Failed to load project'
  } else if (loadingProject) {
    label = 'Loading project...'
  }

  return (
    h('div', {
      style: {
        padding: '.5em 1.33em',
      },
    }, [
      h('h2', label),

      logsByProject.map(({ baseURL, label, files, metadata }) =>
        h(LogProject, {
          key: baseURL,
        }, [
          h('h3', {
            key: 'project-label',
          }, [
            label,
          ]),

          h('div.-grid', {
            key: 'grid',
          }, [
            Object.values(files).map(({ url, label, status }) => [
              h(Status, { key: `${label}-status`, status }),

              h('div.-label', { key: `${label}-label` }, [
                label,
              ]),

              h('div', {
                key: `${label}-link`,
              }, [
                h('a', {
                  href: url,
                  style: {
                    color: '#666',
                    fontSize: '80%',
                  },
                }, url),
              ]),

              h('div.-message', {
                key: `${label}-message`,
              }, [
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

              ...(!(url || '').endsWith('project.json') ? [] : (
                Object.values(metadata).map(({ field, label, status }) => [
                  h('div', {
                    key: `project-${field}-spacer`,
                  }),

                  h('div', { key: `project-${field}-info`, style: { display: 'flex' }}, [
                    h(Status, { status }),

                    h('div.-label', {
                      style: {
                        position: 'absolute',
                        marginLeft: '18px',
                      },
                    }, [
                      label,
                    ]),
                  ]),

                  h('div', {
                    key: `project-${field}-spacer2`,
                  }),
                ])
              )),
            ]),
          ]),
        ])
      ),
    ])
  )
}

module.exports = connect((state, ownProps) => {
  const projectLogs = R.omit([''], state.log) || {}
      , infoLog = (state.log[''] || {})
      , { loadingProject, failedProject } = ownProps

  const showProject = loadingProject || failedProject

  const logsByProject = Object.entries(projectLogs)
    .filter(([ key ]) =>
      showProject
        ? key === showProject
        : true)
    .map(([ baseURL, files ]) => ({
      baseURL,
      label: R.path(['projects', baseURL, 'metadata', 'label'], state) || baseURL,
      files: R.filter(d => {
        if (typeof d.url !== 'string') return true
        return !d.url.includes('project.json#')
      }, files),
      metadata: R.pipe(
        R.filter(({ url }) => typeof url === 'string' && url.includes('project.json#')),
        R.map(({ url, label, status }) => {
          const [ , field ] = url.split('project.json#')
          return { field, label, status }
        })
      )(files),
    }))

  return {
    infoLog,
    logsByProject,
  }
})(Log)
