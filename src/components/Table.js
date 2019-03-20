"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Action = require('../actions')
    , onResize = require('./util/Sized')
    , { findParent, projectForView } = require('../utils')

const TableCell = styled.td`
  padding: 0;

  & .transcript-label {
    width: ${props => props.cellWidth - 4}px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const SaveMarker = styled.a`
  display: inline-block;
  width: calc(100% - 4px);
  text-align: center;
  color: ${props => props.saved ? 'orangered' : 'blue'};
  line-height: 1.66em
  font-weight: bold;

  text-decoration: none;

  &:hover {
    background-color: #f0f0f0;
    border: 2px solid currentcolor;
    border-radius: 4px;
    line-height: calc(1.66em - 4px);
  }
`

const HEADER_HEIGHT = 84;

const FIELDS = [
  { sortPath: '', label: '' },
  { sortPath: ['transcript', 'name'], label: 'Transcript' },
  { sortPath: ['transcript', 'pValue'], label: 'P-Value' },
  { sortPath: ['transcript', 'logATA'], label: 'logATA' },
  { sortPath: ['transcript', 'logFC'], label: 'logFC' },
  { sortPath: ['treatmentA_AbundanceMean'], label: 'Mean' },
  { sortPath: ['treatmentA_AbundanceMedian'], label: 'Median' },
  { sortPath: ['treatmentB_AbundanceMean'], label: 'Mean' },
  { sortPath: ['treatmentB_AbundanceMedian'], label: 'Median' },
]

function calcColumnWidths(width) {
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

function dashesOrFixed(number, places = 2) {
  return number == null ? '--' : number.toFixed(places)
}

class TranscriptRow extends React.Component {
  constructor() {
    super()

    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  shouldComponentUpdate(nextProps) {
    let update = false

    for (const k in nextProps) {
      if (k === 'focusedTranscript') {
        const transcriptID = this.props.data.transcript.name

        update = (
          (nextProps[k] === transcriptID && this.props[k] !== transcriptID) ||
          (nextProps[k] !== transcriptID && this.props[k] === transcriptID)
        )
      } else if (k === 'pValueThreshold') {
        const pValueMeasure = this.props.data.transcript.pValue

        update = (
          (pValueMeasure < nextProps[k] && pValueMeasure >= this.props[k]) ||
          (pValueMeasure >= nextProps[k] && pValueMeasure < this.props[k])
        )
      } else if (nextProps[k] !== this.props[k]) {
        update = true
      }

      if (update) break;
    }
    return update
  }

  handleMouseEnter(e) {
    const { setHoveredTranscript } = this.props

    setHoveredTranscript(findParent('tr', e.target).dataset.transcriptName)
  }

  handleMouseLeave() {
    const { setHoveredTranscript } = this.props

    setHoveredTranscript(null)
  }

  handleClick(e) {
    const { setFocusedTranscript } = this.props

    if (e.target.nodeName.toLowerCase() === 'a') return

    setFocusedTranscript(findParent('tr', e.target).dataset.transcriptName)
  }

  render() {
    const {
      data,
      saved,
      addSavedTranscript,
      removeSavedTranscript,
      columnWidths,
      focusedTranscript,
      pValueThreshold,
    } = this.props

    const { pValue } = data.transcript

    return (
      h('tr', {
        ['data-transcript-name']: data.transcript.name,
        onMouseEnter: this.handleMouseEnter,
        onMouseLeave: this.handleMouseLeave,
        onClick: this.handleClick,
        style: Object.assign({},
          focusedTranscript !== data.transcript.name
            ? null : { backgroundColor: '#e6e6e6' },
          (data.transcript.pValue === undefined || pValue > pValueThreshold)
            ? { color: '#aaa' } : null
        ),
      }, [
        h(TableCell, [
          h(SaveMarker, {
            href: '',
            saved,
            onClick(e) {
              e.preventDefault()

              if (saved) {
                removeSavedTranscript(data.transcript.name)
              } else {
                addSavedTranscript(data.transcript.name)
              }

            },
          }, saved ? '×' : '<'),
        ]),

        h(TableCell, { cellWidth: columnWidths[1] }, [
          h('div.transcript-label', data.transcript.name),
        ]),

        h(TableCell, dashesOrFixed(data.transcript.pValue, 3)),

        h(TableCell, dashesOrFixed(data.transcript.logATA)),

        h(TableCell, dashesOrFixed(data.transcript.logFC)),

        h(TableCell, dashesOrFixed(data.treatmentA_AbundanceMean)),

        h(TableCell, dashesOrFixed(data.treatmentA_AbundanceMedian)),

        h(TableCell, dashesOrFixed(data.treatmentB_AbundanceMean)),

        h(TableCell, dashesOrFixed(data.treatmentB_AbundanceMedian)),
      ])
    )
  }
}

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
`

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

const TableBodyWrapper = styled.div`
  width: 100%;
  height: calc(100% - ${HEADER_HEIGHT}px);
  overflow-y: scroll;
  background-color: white;

  & tr:hover {
    background-color: #e6e6e6;
  }

  & :hover {
    cursor: pointer;
  }
`

const TableHeaderCell = styled.span`
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
          d => R.pathEq(['view', 'focusedTranscript'], d.transcript.name, this.props),
          displayedTranscripts
        )

        if (selectedIdx === -1) return

        let nextSelection

        if (e.code === "ArrowDown") {
          if (selectedIdx + 1 === displayedTranscripts.length) return

          nextSelection = displayedTranscripts[selectedIdx + 1].transcript.name
        }

        if (e.code === "ArrowUp") {
          if (selectedIdx - 1 === -1) return

          nextSelection = displayedTranscripts[selectedIdx - 1].transcript.name
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
    const { brushedTranscripts, savedTranscripts } = this.props.view

    function text(verb, number) {
      return `${number} ${verb} transcript${number > 1 ? 's' : ''}`
    }

    if (brushedTranscripts.size) {
      return text('selected', brushedTranscripts.size)
    } else if (savedTranscripts.size) {
      return text('watched', savedTranscripts.size)
    } else {
      return null
    }
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
    const { width, view, dispatch } = this.props
        , { columnWidths } = this.state

    const {
      comparedTreatments,
      savedTranscripts,
      focusedTranscript,
      displayedTranscripts,
      order,
      pValueThreshold,
    } = view

    const [ treatmentA, treatmentB ] = comparedTreatments || [ null, null ]

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
            }, treatmentA),

            ready && h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -2)),
            }, treatmentB),
          ]),

          h(TableHeaderRow, FIELDS.slice(1).map(({ label, sortPath }, i) =>
            h(TableHeaderCell, {
              key: i,
              left: R.sum(columnWidths.slice(0, i + 1)),
              clickable: true,
              onClick: () => {
                dispatch(Action.UpdateDisplayedTranscripts(
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

        h(TableBodyWrapper, { className: 'table-scroll' }, ready && [
          h('table', [
            h('colgroup', columnWidths.map((width, i) =>
              h('col', { key: i, width }),
            )),

            displayedTranscripts && h('tbody', displayedTranscripts.map(data =>
              h(TranscriptRow, {
                key: `${data.transcript.name}-${treatmentA}-${treatmentB}`,
                data,
                saved: savedTranscripts.has(data.transcript.name),
                setHoveredTranscript: this.setHoveredTranscript,
                addSavedTranscript: this.addSavedTranscript,
                removeSavedTranscript: this.removeSavedTranscript,
                setFocusedTranscript: this.setFocusedTranscript,
                pValueThreshold,
                columnWidths,
                focusedTranscript,
              })
            )),
          ]),
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
    width: el.querySelector('.table-scroll').clientWidth,
  }))
)(Table)
