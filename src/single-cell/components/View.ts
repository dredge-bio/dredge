import { createElement as h } from 'react'
import styled from 'styled-components'
import * as React from 'react'
import { Provider } from 'react-redux'

import { SingleCellProject } from '@dredge/main'

import { useView, useViewDispatch, useViewOptions } from '../hooks'
import * as viewActions from '../actions'
import createStore from '../store'

import UMAP from './UMAP'
import HeatMap from './HeatMap'
import SingleCellTranscriptTable from './Table'
import Toolbar from './Toolbar'
import InfoPane from './InfoPane'

const { useEffect, useRef, useState, useMemo } = React

const ViewerContainer = styled.div`
  display: grid;
  height: 100%;

  padding: .66rem;
  grid-gap: 6px;

  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(15, 1fr);
`

interface GridAreaProps {
  column: string;
  row: string;
  contain?: boolean;
  ['data-area']?: string;
}

const GridArea = styled.div<GridAreaProps>`
  position: relative;
  ${props => props.contain ? 'contain: strict' : ''};
  grid-column: ${ props => props.column };
  grid-row: ${ props => props.row };
`

type ViewProps = {
  project: SingleCellProject;
}

export default function ViewOuter(props: ViewProps) {
  const { project } = props

  const store = useMemo(() => createStore(project), [ project ])

  return (
    h(Provider, { store }, h(View))
  )
}

function View() {
  const dispatch = useViewDispatch()
      , view = useView()
      , currentlySelectedCluster = useRef<Set<string> | null>(null)
      , [ options, updateOptions ] = useViewOptions()
      , [ renderCounter, setRenderCounter ] = useState(0)

  useEffect(() => {
    dispatch(viewActions.setSelectedClusters({
      clusters: options.selectedClusters,
    }))
  }, [options.selectedClusters])

  useEffect(() => {
    dispatch(viewActions.updateDisplayedSingleCellTranscripts({ view }))
  }, [
    view.selectedClusters,
    view.sortPath,
    view.order,
  ])

  // Set selected transcripts once from options
  useEffect(() => {
    const { selectedTranscripts } = options

    if (selectedTranscripts.size) {
      dispatch(viewActions.setSelectedTranscripts({
        transcripts: selectedTranscripts,
      }))

      dispatch(viewActions.setFocusedTranscript({
        transcript: [...selectedTranscripts].pop()!,
      }))
    }
  }, [])

  useEffect(() => {
    const cb = () => {
      setRenderCounter(prev => prev + 1)
    }

    window.addEventListener('application-resize', cb)

    return () => {
      window.removeEventListener('application-resize', cb)
    }
  }, [])

  currentlySelectedCluster.current = view.selectedClusters

  return (
    h(ViewerContainer, {
      key: renderCounter,
    }, ...[
      h(GridArea, {
        column: '1 / span 12',
        row: '1 / span 10',
        contain: true,
        style: {
          border: '1px solid #999',
        },
      }, ...[
        h(UMAP, {
          onClusterClick(cluster) {
            const currentlySelected = currentlySelectedCluster.current

            let nextSelected: Set<string> = new Set()

            if (cluster !== null) {
              if (currentlySelected !== null) {
                nextSelected = new Set([...currentlySelected])
              }

              if (nextSelected.has(cluster)) {
                nextSelected.delete(cluster)
              } else {
                nextSelected.add(cluster)
              }
            }

            updateOptions({
              selectedClusters: nextSelected,
            })
          },
        }),
      ]),

      h(GridArea, {
        column: '1 / span 12',
        row: '11 / span 5',
        contain: true,
        style: {
          border: '1px solid #999',
        },
      }, ...[
        h(HeatMap),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '1 / span 1',
        style: {
          border: '1px solid #999',
        },
      }, ...[
        h(Toolbar),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '2 / span 8',
        contain: true,
        style: {
          border: '1px solid #999',
        },
      }, ...[
        h(SingleCellTranscriptTable),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '10 / span 6',
        contain: true,
        style: {
          marginRight: -6,
          border: '1px solid #999',
        },
      }, ...[
        h(InfoPane),
      ]),
    ])
  )
}
