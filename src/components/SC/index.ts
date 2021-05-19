import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'

import { useViewOptions, useView } from '../../view'
import { useAppDispatch } from '../../hooks'
import { actions as viewActions } from '../../view'

import UMAP from './UMAP'
import Table from '../Table/SingleCell'

const { useEffect } = React

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
          onBrushClusters(clusters) {
            dispatch(viewActions.setSelectedClusters({ clusters }))
          }
        }),
      ]),

      h(GridArea, {
        column: '13 / span 12',
        row: '1 / span 12',
        style: {
          border: '1px solid darkgreen',
        },
      }, [
        h(Table),
      ]),

    ])
  )
}
