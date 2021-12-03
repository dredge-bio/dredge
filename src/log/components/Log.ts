import { createElement as h } from 'react'
import styled from 'styled-components'
import * as React from 'react'

import {
  LoadingIcon,
  useAppSelector
} from '@dredge/main'

import { Log as LogItem } from '../'

const { useState } = React

const IconWrapper = styled.span`
  svg {
  }
`

type ProjectConfigStatus = 'Pending' | 'Failed' | 'Missing' | 'OK'

interface StatusProps {
  status: ProjectConfigStatus;
  indent: boolean;
}

function groupByID(log: Array<LogItem>) {
  const entries: Map<number, LogItem[]> = new Map()

  for (const item of log) {
    const { logID } = item.log

    if (!entries.has(logID)) {
      entries.set(logID, [])
    }

    entries.get(logID)!.push(item)
  }

  return entries
}

const MessageWrapper = styled.div`
  display: grid;
  grid-template-columns: 8px 1fr;

  ul, li {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  li + li {
    margin-top: 4px;
  }

  a {
    text-decoration: none;
    color: black;
    font-weight: bold;
  }
`

function Messages(props: {
  messages: string[]
}) {
  const { messages } = props
      , [ isOpen, setIsOpen ] = useState(false)

  return (
    h(MessageWrapper, {
      style: {
        display: 'grid',
        gridTemplateColumns: '20px 1fr',
      },
    }, messages.length === 0 ? null : [
      messages.length < 2 ? h('span') : h('a', {
        key: 'button',
        href: '#',
        onClick(e: React.MouseEvent) {
          e.preventDefault()
          setIsOpen(prev => !prev)
        },
      }, isOpen ? '－' : '＋'),
      h('ul', { key: 'list' }, isOpen
          ? messages.map((message, i) => h('li', { key: i }, message))
          : h('li', { key: messages.length - 1 }, messages.slice(-1).pop()!)
       ),
    ])
  )
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
border-collapse: collapse;

td {
  font-size: 12px;
  padding: 2px 6px;
  vertical-align: top;
}

tr:hover {
  background: #dfdfdf;
}

/*
td:nth-of-type(1),
td:nth-of-type(2) {
  padding-right: 12px;
}
*/
`

function LogEntry(props: { entries: LogItem[] }) {
  const { entries } = props

  const { project, log } = [...entries].pop()!

  let children

  const messages = []

  for (const entry of entries) {
    if (!('status' in entry.log)) continue;
    if (!('message' in entry.log.status)) continue;
    if (entry.log.status.message) {
      messages.push(entry.log.status.message)
    }
  }

  if ('status' in log) {
    children = [
      h('td', { key: 1 }, h(Status, { status: log.status.type, indent: false })),
      h('td', { key: 2 }, log.label),
      h('td', { key: 3 }, h('a', {
        href: log.url,
      }, log.url)),

      h('td', { key: 4 }, h(Messages, { messages })),
    ]
  } else {
    children = [
      h('td', { key: 'placeholder' }),
      h('td', {
        key: 1,
        className: 'status-message',
      }, log.message),
      h('td', { key: 'placeholder2', colspan: 2 }),
    ]
  }

  return (
    h('tr', null, [
      h('td', { key: 5 }, new Date(entries[0]!.timestamp).toLocaleTimeString()),
      // h('td', { key: 6 }, project),
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

  const entries = groupByID(logArr)

  return (
    h('div', null, ...[
      h('h2', null, label),

      h(LogTable, null, ...[
        h('thead'),

        h('tbody', null, [...entries].map(([ logID, entries ]) =>
          h(LogEntry, {
            key: logID,
            entries,
          })
        )),
      ]),
    ])
  )
}
