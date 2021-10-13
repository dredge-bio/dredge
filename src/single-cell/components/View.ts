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
import TranscriptInfo from './TranscriptInfo'

const { useEffect, useRef, useMemo } = React

const ViewerContainer = styled.div`
  display: grid;
  height: 100%;

  padding: .66rem;

  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(12, 1fr);
`

interface GridAreaProps {
  column: string,
  row: string,
  ['data-area']?: string,
}

const GridArea = styled.div<GridAreaProps>`
  position: relative;
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
    }
  }, [])

  currentlySelectedCluster.current = view.selectedClusters

  return (
    h(ViewerContainer, null, ...[
      h(GridArea, {
        column: '1 / span 12',
        row: '1 / span 8',
        style: {
          border: '1px solid darkgreen',
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
        row: '9 / span 4',
        style: {
          border: '1px solid darkgreen',
        },
      }, ...[
        h(HeatMap),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '1 / span 8',
        style: {
          border: '1px solid darkgreen',
        },
      }, ...[
        h(SingleCellTranscriptTable),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '9 / span 4',
        style: {
          border: '1px solid darkgreen',
        },
      }, ...[
        h(TranscriptInfo),
      ]),

    ])
  )
}
