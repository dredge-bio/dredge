import h from 'react-hyperscript'
import styled, { CSSObject } from 'styled-components'
import * as R from 'ramda'
import * as React from 'react'
import { FixedSizeList as List } from 'react-window'

import { useAppDispatch, useResizeCallback } from '../hooks'
import { useView, useViewProject } from '../view'
import { DifferentialExpression } from '../types'
import { formatNumber } from '../utils'


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

const HEADER_HEIGHT = 84;

const FIELDS = [
  { sortPath: '', label: '' },
  { sortPath: 'name', label: 'Transcript' },
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

type TranscriptCallback = (transcript: string | null) => void

type TranscriptData = {
  displayedTranscripts: Array<DifferentialExpression>;
  savedTranscripts: Set<string>;
  pValueThreshold: number;
  columnWidths: number[];
  focusedTranscript: string | null;

  setHoveredTranscript: TranscriptCallback;
  addSavedTranscript: TranscriptCallback;
  removeSavedTranscript: TranscriptCallback;
  setFocusedTranscript: TranscriptCallback;
}


type TranscriptRowProps = {
  index: number;
  data: TranscriptData;
  style: Partial<CSSStyleDeclaration>;
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

function TranscriptRow(props: TranscriptRowProps) {
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
        h('div.transcript-label', datum.name),
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
  clickable: number;
  css: CSSObject;
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

class Table extends React.Component {
  constructor() {
    super()

    this.state = {}

    this.setFocusedTranscript = this.setFocusedTranscript.bind(this)
    this.setHoveredTranscript = this.setHoveredTranscript.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.addSavedTranscript = this.addSavedTranscript.bind(this)
    this.removeSavedTranscript = this.removeSavedTranscript.bind(this)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  static getDerivedStateFromProps(props, state) {
    if (state.width !== props.width) {
      return {
        width: props.width,
        columnWidths: calcColumnWidths(props.width),
      }
    }

    return null
  }

  handleKeyDown(e) {
    const { dispatch, view } = this.props

    const { displayedTranscripts } = view

    switch (e.code) {
      case "ArrowUp":
      case "ArrowDown": {
        e.preventDefault()

        const selectedIdx = R.findIndex(
          d => R.pathEq(['view', 'focusedTranscript'], d.name, this.props),
          displayedTranscripts
        )

        if (selectedIdx === -1) return

        let nextSelection

        if (e.code === "ArrowDown") {
          if (selectedIdx + 1 === displayedTranscripts.length) return

          nextSelection = displayedTranscripts[selectedIdx + 1].name
        }

        if (e.code === "ArrowUp") {
          if (selectedIdx - 1 === -1) return

          nextSelection = displayedTranscripts[selectedIdx - 1].name
        }

        dispatch(Action.SetFocusedTranscript(nextSelection))
        break;
      }

      case "Space": {
        e.preventDefault()

        const { focusedTranscript, savedTranscripts } = view

        if (focusedTranscript) {
          if (savedTranscripts.has(focusedTranscript)) {
            this.removeSavedTranscript(focusedTranscript)
          } else {
            this.addSavedTranscript(focusedTranscript)
          }
        }
        break;
      }
    }
  }

  getDisplayMessage() {
    const {
      displayedTranscripts,
      brushedArea,
      hoveredBinTranscripts,
      selectedBinTranscripts,
    } = this.props.view

    function text(verb, number) {
      return `${number} ${verb} transcript${number > 1 ? 's' : ''}`
    }

    if (displayedTranscripts) {
      if (brushedArea || hoveredBinTranscripts || selectedBinTranscripts) {
        return text('selected', displayedTranscripts.length)
      } else {
        return text('watched', displayedTranscripts.length)
      }
    }

    return null
  }

  addSavedTranscript(transcriptName) {
    const { dispatch, view: { savedTranscripts }} = this.props
        , newSavedTranscripts = new Set(savedTranscripts)

    newSavedTranscripts.add(transcriptName)

    dispatch(Action.SetSavedTranscripts(newSavedTranscripts))
  }

  removeSavedTranscript(transcriptName) {
    const { dispatch, view: { savedTranscripts }} = this.props
        , newSavedTranscripts = new Set(savedTranscripts)

    newSavedTranscripts.delete(transcriptName)

    dispatch(Action.SetSavedTranscripts(newSavedTranscripts))
  }

  setFocusedTranscript(transcriptName) {
    const { dispatch } = this.props

    dispatch(Action.SetFocusedTranscript(transcriptName))
  }

  setHoveredTranscript(transcriptName) {
    const { dispatch } = this.props

    dispatch(Action.SetHoveredTranscript(transcriptName))
  }

  render() {
    const { width, widthWithScrollbar, height, view, dispatch, project } = this.props
        , { columnWidths } = this.state

    const {
      comparedTreatments,
      savedTranscripts,
      focusedTranscript,
      displayedTranscripts,
      order,
      pValueThreshold,
    } = view

    let treatmentALabel, treatmentBLabel

    if (comparedTreatments) {
      ;[ treatmentALabel, treatmentBLabel ] = comparedTreatments
          .map(t => R.path(['treatments', t, 'label'], project) || t)
    }

    const ready = width == null ? null : true

    return (
      h(TableWrapper, [
        h(TableHeaderWrapper, ready && [
          h('div', [-2, -4].map(col =>
            h('span', {
              style: {
                position: 'absolute',
                left: R.sum(columnWidths.slice(0, col)) - 8,
                top: 0,
                bottom: 0,
                borderLeft: '1px solid #ccc',
              },
            })
          )),

          h(TableHeaderRow, [
            ready && h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -4)),
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
            }, this.getDisplayMessage()),

            ready && h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -4)),
            }, treatmentALabel),

            ready && h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -2)),
            }, treatmentBLabel),
          ]),

          h(TableHeaderRow, FIELDS.slice(1).map(({ label, sortPath }, i) =>
            h(TableHeaderCell, {
              key: i,
              left: R.sum(columnWidths.slice(0, i + 1)),
              clickable: true,
              onClick: () => {
                dispatch(Action.UpdateSortForTreatments(
                  sortPath,
                  (R.equals(view.sortPath, sortPath) && order === 'asc')
                    ? 'desc'
                    : 'asc'
                ))
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
          tableWidthSet: ready,
        }, ready && [
          displayedTranscripts && h(List, {
            overscanCount: 10,
            height,
            itemCount: displayedTranscripts.length,
            focusedTranscript,
            itemData: {
              displayedTranscripts,
              savedTranscripts,
              setHoveredTranscript: this.setHoveredTranscript,
              addSavedTranscript: this.addSavedTranscript,
              removeSavedTranscript: this.removeSavedTranscript,
              setFocusedTranscript: this.setFocusedTranscript,
              pValueThreshold,
              columnWidths,
              focusedTranscript,
            },
            itemSize: 24,
            width: widthWithScrollbar,
          }, TranscriptRow),
        ]),
      ])
    )
  }
}

module.exports = R.pipe(
  connect(state => ({
    view: state.view,
    project: projectForView(state) || {},
  })),
  onResize(el => ({
    height: el.querySelector('.table-scroll').clientHeight,
    width: el.querySelector('.table-scroll').clientWidth,
    widthWithScrollbar: el.querySelector('.table-scroll').innerWidth,
  })),
)(Table)
