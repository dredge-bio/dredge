import { createElement as h } from 'react'
import { Box } from 'rebass'
import styled from 'styled-components'
import { useView } from '../hooks'

const Container = styled(Box)`
  height: 100%;
  max-height: 100%;
  overflow: auto;
`

export default function ClusterLegend() {
  const { project } = useView()
      , { clusters } = project.data

  return (
    h(Container, {
      bg: 'white',
      py: 2,
      px: 3,
      style: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
      },
    }, [...clusters.values()].map(cluster => (
      h('div', {
        key: cluster.id,
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          margin: '4px 8px',
        },
      }, ...[
        h('span', {
          style: {
            display: 'inline-block',
            width: '30px',
            height: '30px',
            marginRight: '4px',
            background: cluster.color,
          },
        }),

        h('span', {
          style: {
            display: 'inline-block',
          },
        }, ...[
          cluster.id,
          ' = ',
          cluster.label,
        ]),
      ])
    )))
  )
}
