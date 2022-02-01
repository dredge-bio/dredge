import { createElement as h } from 'react'
import { Box } from 'rebass'
import styled from 'styled-components'
import { useView } from '../hooks'

const Container = styled(Box)`
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
`

export default function ClusterLegend() {
  const { project } = useView()
      , { clusters } = project.data

  return (
    h(Container, {
      bg: 'white',
      py: 3,
      px: 4,
    }, [...clusters.values()].map(cluster => (
      h('div', {
        key: cluster.id,
      }, ...[
        cluster.id,
        ' = ',
        cluster.label,
      ])
    )))
  )
}
