import h from 'react-hyperscript'
import { Box } from 'rebass'

import { useAppDispatch, useAppSelector } from '../hooks'

import Log from './Log'
import View from './View'
import SingleCell from './SC'

export default function Main() {
  const project = useAppSelector(state => state.projects.global)

  if ('loaded' in project || 'failed' in project) {
    return (
      h(Box, { p: 3 }, [
        h(Log, {
          source: { key: 'global' },
        }),
      ])
    )
  }

  if (project.type === 'Bulk') {
    return h(View)
  } else if (project.type === 'SingleCell') {
    return h(SingleCell)
  } else {
  }

  return null
}
