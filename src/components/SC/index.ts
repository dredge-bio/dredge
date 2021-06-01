import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'

import { useView } from '../../view'
import { useAppDispatch } from '../../hooks'
import { actions as viewActions } from '../../view'

import UMAP from './UMAP'
import { SingleCellTranscriptTable } from '../Table'

const { useEffect, useRef } = React

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

export default function View() {
  const dispatch = useAppDispatch()
      , view = useView('SingleCell')
      , currentlySelectedCluster = useRef<Set<string> | null>(null)

  useEffect(() => {
    dispatch(viewActions.updateDisplayedSingleCellTranscripts({ view }))
  }, [
    view.selectedClusters,
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

            dispatch(viewActions.setSelectedClusters({
              clusters: nextSelected,
            }))
          },
        }),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '1 / span 12',
        style: {
          border: '1px solid darkgreen',
        },
      }, [
        h(SingleCellTranscriptTable),
      ]),

    ])
  )
}
