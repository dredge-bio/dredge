import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'
import { Provider } from 'react-redux'

import { SingleCellProject } from '@dredge/main'

import { useView, useViewDispatch, useViewOptions } from '../hooks'
import * as viewActions from '../actions'
import createStore from '../store'

import UMAP from './UMAP'
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
    h(Provider, { store }, [
      h(View),
    ])
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

  currentlySelectedCluster.current = view.selectedClusters

  return (
    h(ViewerContainer, [

      h(GridArea, {
        column: '1 / span 12',
        row: '1 / span 12',
        style: {
          border: '1px solid darkgreen',
        },
      }, [
        h(UMAP, {
          onClusterClick(cluster, e) {
            const currentlySelected = currentlySelectedCluster.current

            let nextSelected: Set<string> | null = null

            if (e.shiftKey || e.ctrlKey) {
              if (cluster === null) return

              if (currentlySelected !== null) {
                nextSelected = new Set([...currentlySelected])
              } else {
                nextSelected = new Set()
              }

              if (nextSelected.has(cluster)) {
                nextSelected.delete(cluster)
              } else {
                nextSelected.add(cluster)
              }
            } else {
              nextSelected = cluster === null ? null : new Set([cluster])
            }

            updateOptions({
              selectedClusters: nextSelected,
            })
          },
        }),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '1 / span 8',
        style: {
          border: '1px solid darkgreen',
        },
      }, [
        h(SingleCellTranscriptTable),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '9 / span 4',
        style: {
          border: '1px solid darkgreen',
        },
      }, [
        h(TranscriptInfo),
      ]),

    ])
  )
}
