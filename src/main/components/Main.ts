import { createElement as h } from 'react'
import { Box } from 'rebass'

import { useAppSelector } from '../hooks'

import { LogViewer } from '@dredge/log'
import { View as BulkView } from '@dredge/bulk'
import { View as SingleCellView } from '@dredge/single-cell'

export function Main() {
  const project = useAppSelector(state => state.projects.directory.global)

  if ('loaded' in project || 'failed' in project) {
    return (
      h(Box, { p: 3 }, ...[
        h(LogViewer, {
          source: { key: 'global' },
        }),
      ])
    )
  }

  if (project.type === 'Bulk') {
    return (
      h(BulkView, { project })
    )
  } else if (project.type === 'SingleCell') {
    return (
      h(SingleCellView, { project })
    )
  } else {
    throw new Error('unknown project type')
  }
}
