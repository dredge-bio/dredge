"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')

const TableCell = styled.td`
  padding: 2px 0;
`

const HEADER_HEIGHT = 56;

const FIELDS = [
  { sortKey: '', label: '' },
  { sortKey: 'label', label: 'Gene' },
  { sortKey: 'pValue', label: 'P-Value' },
  { sortKey: 'logCPM', label: 'logCPM' },
  { sortKey: 'logFC', label: 'logFC' },
  { sortKey: 'treatmentA_RPKMMean', label: 'Mean RPKM' },
  { sortKey: 'treatmentA_RPKMMedian', label: 'Med. RPKM' },
  { sortKey: 'treatmentB_RPKMMean', label: 'Mean RPKM' },
  { sortKey: 'treatmentB_RPKMMedian', label: 'Med. RPKM' },
]

function calcColumnWidths(width) {
  const widths = [
    // Pairwise information (logCPM, logFC, p-value)
    ...R.repeat(70, 3),

    // Sample mean/median RPKMs
    ...R.repeat(92, 4),
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


function GeneRow({ gene }) {
  return (
    h('tr', [
      h(TableCell, ''),

      h(TableCell, gene.label),

      h(TableCell, dashesOrFixed(gene.pValue, 3)),

      h(TableCell, dashesOrFixed(gene.logCPM)),

      h(TableCell, dashesOrFixed(gene.logFC)),

      h(TableCell, dashesOrFixed(gene.treatmentA_RPKMMean)),

      h(TableCell, dashesOrFixed(gene.treatmentA_RPKMMedian)),

      h(TableCell, dashesOrFixed(gene.treatmentB_RPKMMean)),

      h(TableCell, dashesOrFixed(gene.treatmentB_RPKMMedian)),

    ])
  )
}

const TableWrapper = styled.div`
  position: relative;
  height: 100%;

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
    background-color: lightblue;
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

    this.state = {
      width: null,
      sortBy: 'label',
      order: 'asc',
    }
  }

  componentDidMount() {
    this.refreshSize()
  }

  getDisplayedGenes() {
    const { sortBy, order } = this.state
        , { project, brushedGenes, comparedTreatments } = this.props.view
        , { rpkmsForTreatmentGene } = project
        , [ treatmentA, treatmentB ] = comparedTreatments

    const genes = [...brushedGenes].map(gene => {
      const [
        treatmentA_RPKMMean,
        treatmentA_RPKMMedian,
        treatmentB_RPKMMean,
        treatmentB_RPKMMedian,
      ] = R.chain(
        rpkms => [d3.mean(rpkms), d3.median(rpkms)],
        [rpkmsForTreatmentGene(treatmentA, gene.label), rpkmsForTreatmentGene(treatmentB, gene.label)]
      )

      return Object.assign({
        treatmentA_RPKMMean,
        treatmentA_RPKMMedian,
        treatmentB_RPKMMean,
        treatmentB_RPKMMedian,
      }, gene)
    })


    return R.sort(
      (order === 'asc' ? R.ascend : R.descend)(R.prop(sortBy)),
      genes
    )
  }

  refreshSize() {
    this.setState({
      width: this.el.querySelector('.table-scroll').clientWidth,
    })
  }

  render() {
    const { width, sortBy, order } = this.state
        , { comparedTreatments } = this.props.view
        , [ treatmentA, treatmentB ] = (comparedTreatments || [])

    const ready = (width !== null && comparedTreatments !== null) || null
        , columnWidths = ready && calcColumnWidths(width)

    return (
      h(TableWrapper, {
        innerRef: el => { this.el = el },
      }, [
        h(TableHeaderWrapper, [
          ready && h('div', [-2, -4].map(col =>
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

          h(TableHeaderRow, ready && [
            h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -4)),
            }, treatmentA),
            h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -2)),
            }, treatmentB),
          ]),

          h(TableHeaderRow, ready && FIELDS.slice(1).map(({ label, sortKey }, i) =>
            h(TableHeaderCell, {
              key: i,
              left: R.sum(columnWidths.slice(0, i + 1)),
              clickable: true,
              onClick: () => {
                this.setState(prev => ({
                  sortBy: sortKey,
                  order: prev.sortBy === sortKey
                    ? order === 'asc' ? 'desc' : 'asc'
                    : 'asc',
                }))
              },
            }, [
              label,
              sortKey === sortBy
                ? order === 'asc'
                  ? ' ▾'
                  : ' ▴'
                : null,
            ])
          )),
        ]),

        h(TableBodyWrapper, { className: 'table-scroll' }, [
          h('table', [
            ready && h('colgroup', columnWidths.map((width, i) =>
              h('col', { key: i, width }),
            )),

            h('tbody', ready && this.getDisplayedGenes().map(gene =>
              h(GeneRow, {
                key: `brushed-${gene.label}`,
                saved: false,
                gene,
              })
            )),
          ]),
        ]),
      ])
    )
  }
}

module.exports = connect(state => ({
  view: state.currentView,
}))(Table)
