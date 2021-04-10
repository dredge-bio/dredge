import h from 'react-hyperscript'
import * as R from 'ramda'
import * as React from 'react'

import { useAppDispatch } from '../../hooks'
import { formatNumber } from '../../utils'

import { TranscriptData } from './types'

type TranscriptRowProps = {
  index: number;
  data: TranscriptData;
  style: React.CSSProperties;
}


type TableCellProps = {
  columnWidths: number[],
  columnNumber: number,
}


function TableCell(props: React.PropsWithChildren<TableCellProps>) {
  const { columnWidths, columnNumber, children } = props
      , left = R.sum(columnWidths.slice(0, columnNumber))
      , width = columnWidths[columnNumber]

  return (
    React.createElement('div', {
      style: {
        padding: 0,
        position: 'absolute',
        left,
        width,
      },
    }, children)
  )
}

function handleRowMouseEvent(
  dispatch: ReturnType<typeof useAppDispatch>,
  data: TranscriptData
) {
  return (e: React.MouseEvent) => {
    let transcript: string | null

    const target = e.target as HTMLElement
        , transcriptRow = target.closest('.transcript-row') as HTMLElement | null

    if (e.type === 'mouseenter') {
      if (!transcriptRow) return
      transcript = transcriptRow.dataset.transcriptName!
      data.setHoveredTranscript(transcript)
    } else if (e.type === 'mouseleave') {
      data.setHoveredTranscript(null)
    } else if (e.type === 'click') {
      if (target.nodeName.toLowerCase() === 'a' || !transcriptRow) return
      transcript = transcriptRow.dataset.transcriptName!

      if (data.focusedTranscript === transcript) {
        data.setFocusedTranscript(null)
      } else {
        data.setFocusedTranscript(transcript)
      }
    }
  }
}


export default function TranscriptRow(props: TranscriptRowProps) {
  const { data, index, style } = props
      , { columnWidths } = data
      , datum = data.displayedTranscripts.transcripts[index]!
      , dispatch = useAppDispatch()
      , handler = handleRowMouseEvent(dispatch, data) // FIXME: Share this among all rows
      , saved = data.savedTranscripts.has(datum.name)

  const extraStyle: Partial<CSSStyleDeclaration> = {}

  if (data.focusedTranscript === datum.name) {
    extraStyle.backgroundColor = '#e6e6e6'
  }

  if (datum.pValue === null || datum.pValue > data.pValueThreshold) {
    extraStyle.color = '#aaa'
  }

  return (
    h('div', {
      className: 'transcript-row',
      ['data-transcript-name']: datum.name,
      onMouseEnter: handler,
      onMouseLeave: handler,
      onClick: handler,
      style: {
        ...style,
        ...extraStyle,
      },
    }, [
      h(TableCell, {
        columnWidths,
        columnNumber: 0,
      }, [
        h('a', {
          className: 'transcript-save-marker',
          href: '',
          style: {
            color: saved ? 'orangered' : 'blue',
          },
          onClick(e: React.MouseEvent) {
            e.preventDefault()

            if (saved) {
              data.removeSavedTranscript(datum.name)
            } else {
              data.addSavedTranscript(datum.name)
            }

          },
        }, saved ? '×' : '<'),
      ]),

      h(TableCell, {
        columnWidths,
        columnNumber: 1,
      }, [
        h('div.transcript-label', datum.label),
      ]),

      h(TableCell, {
        columnWidths,
        columnNumber: 2,
      }, formatNumber(datum.pValue, 3)),

      h(TableCell, {
        columnWidths,
        columnNumber: 3,
      }, formatNumber(datum.logATA)),

      h(TableCell, {
        columnWidths,
        columnNumber: 4,
      }, formatNumber(datum.logFC)),

      h(TableCell, {
        columnWidths,
        columnNumber: 5,
      }, formatNumber(datum.treatmentA_AbundanceMean)),

      h(TableCell, {
        columnWidths,
        columnNumber: 6,
      }, formatNumber(datum.treatmentA_AbundanceMedian)),

      h(TableCell, {
        columnWidths,
        columnNumber: 7,
      }, formatNumber(datum.treatmentB_AbundanceMean)),

      h(TableCell, {
        columnWidths,
        columnNumber: 8,
      }, formatNumber(datum.treatmentB_AbundanceMedian)),
    ])
  )
}
