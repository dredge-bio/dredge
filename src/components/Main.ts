import h from 'react-hyperscript'
import { Box } from 'rebass'

import { useAppDispatch, useAppSelector } from '../hooks'

import Log from './Log'
import View from './View'

export default function Main() {
  const project = useAppSelector(state => state.projects.global)

  if (!project.loaded || project.failed) {
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
  }

  return null
}
