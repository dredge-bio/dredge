"use strict";

import h from 'react-hyperscript'
import * as R from 'ramda'
import { connect } from 'react-redux'
import styled from 'styled-components'
import LoadingIcon from './LoadingIcon'

import {
  DredgeState,
  useAppSelector,
} from '../ts_types'

import {
  ResourceLogEntry,
  StatusLogEntry,
  Log,
} from '../log'

const IconWrapper = styled.span`
  svg {
  }
`

type ProjectConfigStatus = 'Pending' | 'Failed' | 'Missing' | 'OK'

interface StatusProps {
  status: ProjectConfigStatus;
  indent: boolean;
}

function Status(props: StatusProps) {
  const { status, indent } = props

  let indicator: string | React.ReactElement

  switch (status) {
    case 'Pending':
      // indicator = h(IconWrapper, {} , h(LoadingIcon))
      indicator = '...'
      break;

    case 'Failed':
      indicator = '✖';
      break;
    case 'Missing':
      indicator = '--';
      break;
    case 'OK':
      indicator = '✔';
      break;
  }

  return h('span', {
    style: {
      whiteSpace: 'nowrap',
      marginLeft: indent ? '24px' : 0,
    },
  }, indicator)
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

const LogEntryWrapper = styled.div`
`

function LogEntry({ project, id, timestamp, log }: Log) {
  let children

  if ('status' in log) {
    children = [
      h('span', { key: 1 }, h(Status, { status: log.status, indent: false })),
      h('span', { key: 2 }, log.label),
      h('span', { key: 3 }, h('a', {
        href: log.url,
      }, log.url)),
      h('span', { key: 4 }, log.message)
    ]
  } else {
    children = [
      h('span', {
        key: 1,
        className: 'status-message',
      }, log.message)
    ]
  }

  return (
    h(LogEntryWrapper, [
      h('span', { key: 5 }, timestamp),
      h('span', { key: 6 }, project ? project.key : null),
      ...children,
    ])
  )
}

export default function Log() {
  let label = 'Log'

  const {
    initializing,
    failedProject,
    loadingProject,
  } = useAppSelector(state => {
    let initializing = true
      , loadingProject = true
      , failedProject = false

    const globalProject = state.projects.global

    if (globalProject.loaded) {
      loadingProject = false
      initializing = false

      if (globalProject.failed) {
        failedProject = true
      }
    }

    return {
      initializing,
      failedProject,
      loadingProject,
    }
  })

  const logArr = useAppSelector(state => state.log)

  if (initializing) {
    label = 'Initializing...'
  } else if (failedProject) {
    label = 'Failed to load project'
  } else if (loadingProject) {
    label = 'Loading project...'
  }

  logArr.map(({ project, log }) => {
  })

  return (
    h('div', [
      h('h2', label),

      h('div', logArr.map(entry =>
        h(LogEntry, {
          key: entry.id,
          ...entry,
        })
      )),

      /*
      logsByProject.map(({ key, label, files, metadata }) =>
        h(LogProject, {
          key,
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
      */
    ])
  )
}

/*
const X = connect((state: DredgeState, ownProps) => {
  const projectLogs = R.omit([''], state.log) || {}
      , infoLog = (state.log[''] || {})
      , { loadingProject, failedProject } = ownProps

  const showProject = loadingProject || failedProject

  const logsByProject = Object.entries(projectLogs)
    .filter(([ key ]) =>
      showProject
        ? key === showProject
        : true)
    .map(([ key, files ]) => ({
      key,
      label: R.path(['projects', key, 'config', 'label'], state) || ' ',
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

export default X
*/
