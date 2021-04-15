import h from 'react-hyperscript'
import styled, { CSSObject } from 'styled-components'
import * as R from 'ramda'
import * as React from 'react'
import { FixedSizeList as List } from 'react-window'

import { useAppDispatch, useResizeCallback } from '../../hooks'
import {
  useView,
  useComparedTreatmentLabels,
  actions as viewActions
} from '../../view'
import { SortPath } from '../../types'

import TranscriptRow from './Row'

const { useEffect, useState } = React

const TableWrapper = styled.div`
  position: relative;
  height: 100%;
  border: 1px solid #ccc;

  & table {
    table-layout: fixed;
    border-collapse: collapse;
    background-color: white;
  }

  & * {
    font-family: SourceSansPro;
    font-size: 14px;
  }

  & th {
    text-align: left;
  }

  .transcript-row: {
    position: relative;
  }

  .transcript-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transcript-save-marker {
    display: inline-block;
    width: calc(100% - 4px);
    text-align: center;
    line-height: 1.66em
    font-weight: bold;

    text-decoration: none;
  }

  .transcript-save-mraker:hover {
    background-color: #f0f0f0;
    border: 2px solid currentcolor;
    border-radius: 4px;
    line-height: calc(1.66em - 4px);
  }
`

const HEADER_HEIGHT = 84;

const FIELDS = [
  { sortPath: '', label: '' },
  { sortPath: 'label', label: 'Transcript' },
  { sortPath: 'pValue', label: 'P-Value' },
  { sortPath: 'logATA', label: 'logATA' },
  { sortPath: 'logFC', label: 'logFC' },
  { sortPath: 'treatmentA_AbundanceMean', label: 'Mean' },
  { sortPath: 'treatmentA_AbundanceMedian', label: 'Median' },
  { sortPath: 'treatmentB_AbundanceMean', label: 'Mean' },
  { sortPath: 'treatmentB_AbundanceMedian', label: 'Median' },
]

function calcColumnWidths(width: number) {
  const widths = [
    // Pairwise information (logATA, logFC, p-value)
    ...R.repeat(64, 3),

    // Sample mean/median Abundances
    ...R.repeat(88, 4),
  ]

  return [
    // the little icon to save/remove transcripts
    28,

    width - 28 - R.sum(widths),
    ...widths,
  ]
}

const TableHeaderWrapper = styled.div`
  height: ${HEADER_HEIGHT}px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
`

const TableHeaderRow = styled.div`
  position: relative;
  height: ${HEADER_HEIGHT / 3}px;
  line-height: ${HEADER_HEIGHT / 3}px;
`

const TableBodyWrapper = styled.div<{
  tableWidthSet: boolean;
}>`
  width: 100%;
  height: calc(100% - ${HEADER_HEIGHT}px);
  background-color: white;
  overflow-y: ${props => props.tableWidthSet ? 'unset' : 'scroll'};

  & .transcript-row:hover {
    background-color: #e6e6e6;
  }

  & :hover {
    cursor: pointer;
  }
`

const TableHeaderCell = styled.span<{
  left: number;
  clickable?: boolean;
  css?: CSSObject;
}>`
  position: absolute;
  font-weight: bold;
  user-select: none;
  top: 0;
  bottom: 0;
  left: ${props => props.left}px;
  ${props => props.clickable ? 'cursor: pointer;' : ''}
  ${props => props.css}
`

type DimensionState = null | {
  height: number;
  width: number;
  widthWithScrollbar: number;
  columnWidths: number[];
}

export default function _Table() {
  const view = useView()
      , dispatch = useAppDispatch()
      , [ dimensions, setDimensions ] = useState<DimensionState>(null)

  const ref = useResizeCallback(el => {
    const tableEl = el.querySelector('.table-scroll')! as HTMLDivElement

    const dims = {
      height: tableEl.clientHeight,
      width: tableEl.clientWidth,

      // FIXME: is this right?
      widthWithScrollbar: tableEl.offsetWidth,
    }

    setDimensions({
      ...dims,
      columnWidths: calcColumnWidths(dims.width),
    })
  })

  useEffect(() => {
    const cb = () => {
    }

    window.addEventListener('keydown', cb)
    return () => {
      window.removeEventListener('keydown', cb)
    }
  }, [])

  const {
    savedTranscripts,
    focusedTranscript,
    displayedTranscripts,
    order,
    pValueThreshold,
  } = view

  const [ treatmentALabel, treatmentBLabel ] = useComparedTreatmentLabels()

  const handlers = {
    setHoveredTranscript(transcript: string | null) {
      dispatch(viewActions.setHoveredTranscript({ transcript }))
    },
    setFocusedTranscript(transcript: string | null) {
      dispatch(viewActions.setFocusedTranscript({ transcript }))
    },
    addSavedTranscript(transcript: string) {
      const next = new Set([...savedTranscripts, transcript])

      dispatch(viewActions.setSavedTranscripts({
        transcriptNames: [...next],
      }))
    },
    removeSavedTranscript(transcript: string) {
      const next = new Set(savedTranscripts)
      next.delete(transcript)
      dispatch(viewActions.setSavedTranscripts({
        transcriptNames: [...next],
      }))
    },
  }

  return (
    h(TableWrapper, { ref }, [
      h(TableHeaderWrapper, dimensions && [
        h('div', [-2, -4].map(col =>
          h('span', {
            style: {
              position: 'absolute',
              left: R.sum(dimensions.columnWidths.slice(0, col)) - 8,
              top: 0,
              bottom: 0,
              borderLeft: '1px solid #ccc',
            },
          })
        )),

        h(TableHeaderRow, [
          dimensions && h(TableHeaderCell, {
            left: R.sum(dimensions.columnWidths.slice(0, -4)),
            css: {
              right: 0,
              borderBottom: '1px solid #ccc',
              backgroundColor: '#f0f0f0',
              marginLeft: '-7px',
              paddingLeft: '7px',
            },
          }, 'Treatment abundance'),
        ]),

        h(TableHeaderRow, [
          h('div', {
            style: {
              marginLeft: 24,
            },
          } /* FIXME this.getDisplayMessage() */),

          dimensions && h(TableHeaderCell, {
            left: R.sum(dimensions.columnWidths.slice(0, -4)),
          }, treatmentALabel),

          dimensions && h(TableHeaderCell, {
            left: R.sum(dimensions.columnWidths.slice(0, -2)),
          }, treatmentBLabel),
        ]),

        h(TableHeaderRow, FIELDS.slice(1).map(({ label, sortPath }, i) =>
          h(TableHeaderCell, {
            key: i,
            left: R.sum(dimensions.columnWidths.slice(0, i + 1)),
            clickable: true,
            onClick: () => {
              dispatch(viewActions.updateSortForTreatments({
                sortPath: sortPath as SortPath,
                order: (R.equals(view.sortPath, sortPath) && order === 'asc')
                  ? 'desc'
                  : 'asc',
              }))
            },
          }, [
            label,
            R.equals(sortPath, view.sortPath)
              ? h('span', {
                  style: {
                    position: 'relative',
                    fontSize: 10,
                    top: -1,
                    left: 1,
                  },
                }, view.order === 'asc' ? ' ▾' : ' ▴')
              : null,
          ])
        )),
      ]),

      h(TableBodyWrapper, {
        className: 'table-scroll',
        tableWidthSet: dimensions !== null,
      }, dimensions && displayedTranscripts && (
        React.createElement(List, {
          overscanCount: 10,
          height: dimensions.height,
          itemCount: displayedTranscripts.transcripts.length,
          itemData: {
            focusedTranscript,
            displayedTranscripts,
            savedTranscripts,
            pValueThreshold,
            columnWidths: dimensions.columnWidths,
            ...handlers,
          },
          itemSize: 24,
          width: dimensions.widthWithScrollbar,
          children: TranscriptRow,
        })
      )),
    ])
  )
}
