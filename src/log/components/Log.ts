import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'

import {
  LoadingIcon,
  useAppSelector
} from '@dredge/main'

import { Log as LogItem } from '../'

const IconWrapper = styled.span`
  svg {
  }
`

type ProjectConfigStatus = 'Pending' | 'Failed' | 'Missing' | 'OK'

interface StatusProps {
  status: ProjectConfigStatus;
  indent: boolean;
}

function filterMultiple(log: Array<LogItem>) {
  const ret: Array<LogItem> = []
      , urlsVisited: Record<string, number> = {}

  log.forEach(entry => {
    if ('url' in entry.log) {
      const pos = urlsVisited[entry.log.url]

      if (typeof pos === 'number') {
        ret[pos] = entry
      } else {
        urlsVisited[entry.log.url] = ret.push(entry) - 1
      }
    } else {
      ret.push(entry)
    }
  })

  return ret
}

function Status(props: StatusProps) {
  const { status, indent } = props

  let indicator: string | React.ReactElement

  switch (status) {
    case 'Pending':
      indicator = h(IconWrapper, {} , h(LoadingIcon))
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

/*
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
*/

const LogTable = styled.table`
td {
  font-size: 12px;
  padding: 2px 6px;
}

/*
td:nth-of-type(1),
td:nth-of-type(2) {
  padding-right: 12px;
}
*/
`

function LogEntry({ project, timestamp, log }: LogItem) {
  let children

  if ('status' in log) {
    children = [
      h('td', { key: 1 }, h(Status, { status: log.status, indent: false })),
      h('td', { key: 2 }, log.label),
      h('td', { key: 3 }, h('a', {
        href: log.url,
      }, log.url)),
      h('td', { key: 4 }, log.message),
    ]
  } else {
    children = [
      h('td'),
      h('td', {
        key: 1,
        colSpan: 3,
        className: 'status-message',
      }, log.message),
    ]
  }

  return (
    h('tr', [
      h('td', { key: 5 }, new Date(timestamp).toLocaleTimeString()),
      h('td', { key: 6 }, project),
      ...children,
    ])
  )
}

export function LogViewer() {
  let label = 'Log'

  const {
    initializing,
    failedProject,
    loadingProject,
  } = useAppSelector(state => {
    let initializing = true
      , loadingProject = true
      , failedProject = false

    const globalProject = state.projects.directory.global

    if ('failed' in globalProject) {
      failedProject = true
    } else if ('loaded' in globalProject) {
      // FIXME ?
    } else {
      loadingProject = false
      initializing = false
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

  return (
    h('div', [
      h('h2', label),

      h(LogTable, [
        h('thead', []),

        h('tbody', filterMultiple(logArr).map(entry =>
          h(LogEntry, {
            key: entry.id,
            ...entry,
          })
        )),
      ]),
    ])
  )
}
