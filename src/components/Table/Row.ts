import h from 'react-hyperscript'
import { CSSObject } from 'styled-components'
import * as R from 'ramda'
import * as React from 'react'

import { useAppDispatch } from '../../hooks'
import { formatNumber } from '../../utils'

import { TranscriptData } from './types'

type TranscriptRowProps = {
  index: number;
  data: TranscriptData;
  style: CSSObject;
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

function handleRowMouseEvent(dispatch: ReturnType<typeof useAppDispatch>) {
  return (e: React.MouseEvent) => {
    let transcript: string | null

    if (e.type === 'mouseenter') {
      transcript = (e.target as HTMLElement).dataset.transcriptName!
    } else {
      transcript = null
    }
  }
}


export default function TranscriptRow(props: TranscriptRowProps) {
  const { data, index, style } = props
      , { columnWidths } = data
      , datum = data.displayedTranscripts[index]!
      , dispatch = useAppDispatch()
      , handler = handleRowMouseEvent(dispatch) // FIXME: Share this among all rows
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
      // onClick: this.handleClick,
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

/*
class TranscriptRow extends React.Component {
  constructor() {
    super()

    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  get datum() {
    const { index } = this.props

    return this.props.data.displayedTranscripts[index]
  }

  shouldComponentUpdate(nextProps) {
    let update = false

    for (const k in nextProps.data) {
      if (k === 'focusedTranscript') {
        const transcriptID = this.datum.name

        update = (
          (nextProps.data[k] === transcriptID && this.props.data[k] !== transcriptID) ||
          (nextProps.data[k] !== transcriptID && this.props.data[k] === transcriptID)
        )
      } else if (k === 'pValueThreshold') {
        const pValueMeasure = this.datum.pValue

        update = (
          (pValueMeasure < nextProps.data[k] && pValueMeasure >= this.props.data[k]) ||
          (pValueMeasure >= nextProps.data[k] && pValueMeasure < this.props.data[k])
        )
      } else if (nextProps.data[k] !== this.props.data[k]) {
        update = true
      }

      if (update) break;
    }

    return update
  }

  handleMouseEnter(e) {
    const { setHoveredTranscript } = this.props.data

    setHoveredTranscript(e.target.closest('.transcript-row').dataset.transcriptName)
  }

  handleMouseLeave() {
    const { setHoveredTranscript } = this.props.data

    setHoveredTranscript(null)
  }

  handleClick(e) {
    const { setFocusedTranscript } = this.props.data

    if (e.target.nodeName.toLowerCase() === 'a') return

    setFocusedTranscript(e.target.closest('.transcript-row').dataset.transcriptName)
  }
}
*/
