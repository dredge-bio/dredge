"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Action = require('../actions')
    , onResize = require('./util/Sized')
    , { findParent } = require('../utils')

const TableCell = styled.td`
  padding: 0;

  & .gene-label {
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

const HEADER_HEIGHT = 56;

const FIELDS = [
  { sortPath: '', label: '' },
  { sortPath: ['gene', 'label'], label: 'Gene' },
  { sortPath: ['gene', 'pValue'], label: 'P-Value' },
  { sortPath: ['gene', 'logCPM'], label: 'logCPM' },
  { sortPath: ['gene', 'logFC'], label: 'logFC' },
  { sortPath: ['treatmentA_RPKMMean'], label: 'Mean RPKM' },
  { sortPath: ['treatmentA_RPKMMedian'], label: 'Med. RPKM' },
  { sortPath: ['treatmentB_RPKMMean'], label: 'Mean RPKM' },
  { sortPath: ['treatmentB_RPKMMedian'], label: 'Med. RPKM' },
]

function calcColumnWidths(width) {
  const widths = [
    // Pairwise information (logCPM, logFC, p-value)
    ...R.repeat(64, 3),

    // Sample mean/median RPKMs
    ...R.repeat(88, 4),
  ]

  return [
    // the little icon to save/remove genes
    28,

    width - 28 - R.sum(widths),
    ...widths,
  ]
}

function dashesOrFixed(number, places = 2) {
  return number == null ? '--' : number.toFixed(places)
}

class GeneRow extends React.Component {
  constructor() {
    super()

    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  shouldComponentUpdate(nextProps) {
    let update = false

    for (const k in nextProps) {
      if (k === 'focusedGene') {
        const geneName = this.props.data.gene.label

        update = (
          (nextProps[k] === geneName && this.props[k] !== geneName) ||
          (nextProps[k] !== geneName && this.props[k] === geneName)
        )
      } else if (k === 'pValueThreshold') {
        const pValueMeasure = this.props.data.gene.pValue

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
    const { setHoveredGene } = this.props

    setHoveredGene(findParent('tr', e.target).dataset.geneName)
  }

  handleMouseLeave() {
    const { setHoveredGene } = this.props

    setHoveredGene(null)
  }

  handleClick(e) {
    const { setFocusedGene } = this.props

    if (e.target.nodeName.toLowerCase() === 'a') return

    setFocusedGene(findParent('tr', e.target).dataset.geneName)
  }

  render() {
    const {
      data,
      saved,
      addSavedGene,
      removeSavedGene,
      columnWidths,
      focusedGene,
      pValueThreshold,
    } = this.props

    const { pValue } = data.gene

    return (
      h('tr', {
        ['data-gene-name']: data.gene.label,
        onMouseEnter: this.handleMouseEnter,
        onMouseLeave: this.handleMouseLeave,
        onClick: this.handleClick,
        style: Object.assign({},
          focusedGene !== data.gene.label
            ? null : { backgroundColor: '#e6e6e6' },
          (data.gene.pValue === undefined || pValue >= pValueThreshold)
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
                removeSavedGene(data.gene.label)
              } else {
                addSavedGene(data.gene.label)
              }

            },
          }, saved ? '×' : '<'),
        ]),

        h(TableCell, { cellWidth: columnWidths[1] }, [
          h('div.gene-label', data.gene.label),
        ]),

        h(TableCell, dashesOrFixed(data.gene.pValue, 3)),

        h(TableCell, dashesOrFixed(data.gene.logCPM)),

        h(TableCell, dashesOrFixed(data.gene.logFC)),

        h(TableCell, dashesOrFixed(data.treatmentA_RPKMMean)),

        h(TableCell, dashesOrFixed(data.treatmentA_RPKMMedian)),

        h(TableCell, dashesOrFixed(data.treatmentB_RPKMMean)),

        h(TableCell, dashesOrFixed(data.treatmentB_RPKMMedian)),
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
  height: ${HEADER_HEIGHT / 2}px;
  line-height: ${HEADER_HEIGHT / 2}px;
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
`

class Table extends React.Component {
  constructor() {
    super()

    this.state = {}

    this.setFocusedGene = this.setFocusedGene.bind(this)
    this.setHoveredGene = this.setHoveredGene.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.addSavedGene = this.addSavedGene.bind(this)
    this.removeSavedGene = this.removeSavedGene.bind(this)
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

    switch (e.code) {
      case "ArrowUp":
      case "ArrowDown": {
        e.preventDefault()

        const selectedIdx = R.findIndex(
          d => R.pathEq(['view', 'focusedGene'], d.gene.label, this.props),
          this.displayedGenes
        )

        if (selectedIdx === -1) return

        let nextSelection

        if (e.code === "ArrowDown") {
          if (selectedIdx + 1 === this.displayedGenes.length) return

          nextSelection = this.displayedGenes[selectedIdx + 1].gene.label
        }

        if (e.code === "ArrowUp") {
          if (selectedIdx - 1 === -1) return

          nextSelection = this.displayedGenes[selectedIdx - 1].gene.label
        }

        dispatch(Action.SetFocusedGene(nextSelection))
        break;
      }

      case "Space": {
        e.preventDefault()

        const { focusedGene, savedGenes } = view

        if (focusedGene) {
          if (savedGenes.has(focusedGene)) {
            this.removeSavedGene(focusedGene)
          } else {
            this.addSavedGene(focusedGene)
          }
        }
        break;
      }
    }
  }

  getDisplayMessage() {
    const { brushedGenes, savedGenes } = this.props.view

    function text(verb, number) {
      return `${number} ${verb} gene${number > 1 ? 's' : ''}`
    }

    if (brushedGenes.size) {
      return text('selected', brushedGenes.size)
    } else if (savedGenes.size) {
      return text('watched', savedGenes.size)
    } else {
      return null
    }
  }

  addSavedGene(geneName) {
    const { dispatch, view: { savedGenes }} = this.props
        , newSavedGenes = new Set(savedGenes)

    newSavedGenes.add(geneName)

    dispatch(Action.SetSavedGenes(newSavedGenes))
  }

  removeSavedGene(geneName) {
    const { dispatch, view: { savedGenes }} = this.props
        , newSavedGenes = new Set(savedGenes)

    newSavedGenes.delete(geneName)

    dispatch(Action.SetSavedGenes(newSavedGenes))
  }

  setFocusedGene(geneName) {
    const { dispatch } = this.props

    dispatch(Action.SetFocusedGene(geneName))
  }

  setHoveredGene(geneName) {
    const { dispatch } = this.props

    dispatch(Action.SetHoveredGene(geneName))
  }

  render() {
    const { width, view, dispatch } = this.props
        , { columnWidths } = this.state

    const {
      comparedTreatments,
      savedGenes,
      focusedGene,
      displayedGenes,
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
                dispatch(Action.UpdateDisplayedGenes(
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

            displayedGenes && h('tbody', displayedGenes.map(data =>
              h(GeneRow, {
                key: `${data.gene.label}-${treatmentA}-${treatmentB}`,
                data,
                saved: savedGenes.has(data.gene.label),
                setHoveredGene: this.setHoveredGene,
                addSavedGene: this.addSavedGene,
                removeSavedGene: this.removeSavedGene,
                setFocusedGene: this.setFocusedGene,
                pValueThreshold,
                columnWidths,
                focusedGene,
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
    view: state.currentView,
  })),
  onResize(el => ({
    width: el.querySelector('.table-scroll').clientWidth,
  }))
)(Table)
