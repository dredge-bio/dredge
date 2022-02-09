import { createElement as h, useState } from 'react'
import { Box } from 'rebass'
import styled from 'styled-components'
import { useView, useViewDispatch } from '../hooks'
import * as actions from '../actions'

const Container = styled(Box)`
  height: 100%;
  max-height: 100%;
  overflow: auto;

  display: flex;
  flex-direction: column;
  flex-wrap: wrap;

  .legend-cluster {
      display: inline-flex;
      align-items: center;
      padding: 4px;
      column-gap: 6px;

      border: 1px solid transparent;
  }

  .legend-cluster[data-cluster-hovered="true"] {
    border-color: black;
    background-color: #f0f0f0;
  }

  .legend-cluster span {
      display: inline-block;
  }
`

export default function ClusterLegend() {
  const { project, hoveredCluster } = useView()
      , dispatch = useViewDispatch()
      , { clusters } = project.data
      , [ localHoveredCluster, setLocalHoveredCluster ] = useState<string | null>(null)

  return (
    h(Container, {
      bg: 'white',
      p: 2,
    }, [...clusters.values()].map(cluster => (
      h('div', {
        key: cluster.id,
        className: 'legend-cluster',
        ['data-cluster-hovered']: (
          localHoveredCluster === cluster.id ||
            hoveredCluster.cluster?.id === cluster.id
        ),
        onMouseEnter() {
          setLocalHoveredCluster(cluster.id)
          dispatch(actions.setHoveredCluster({
            cluster,
            source: 'HeatMap',
          }))
        },
        onMouseLeave() {
          setLocalHoveredCluster(null)
          dispatch(actions.setHoveredCluster({
            cluster: null,
            source: 'HeatMap',
          }))
        },
      }, ...[
        h('span', {
          style: {
            marginRight: '6px',
            width: '30px',
            height: '30px',
            background: cluster.color,
          },
        }),

        h('span', {
          style: {
            fontWeight: 'bold',
            marginRight: '5px',
          },
        }, cluster.id + '. '),

        h('span', null, ...[
          cluster.label,
        ]),
      ])
    )))
  )
}
