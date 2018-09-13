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
  '',
  'Gene',
  'P-Value',
  'Log CPM',
  'Log FC',
  'Mean RPKM',
  'Med. RPKM',
  'Mean RPKM',
  'Med. RPKM',
]

function calcColumnWidths(width) {
  const widths = [
    // Pairwise information (logCPM, logFC, p-value)
    ...R.repeat(64, 3),

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


function GeneRow({
  gene,
  treatmentRPKMs,
}) {

  const [
    treatmentA_RPKMMean,
    treatmentA_RPKMMedian,
    treatmentB_RPKMMean,
    treatmentB_RPKMMedian,
  ] = R.chain(rpkms => [d3.mean(rpkms), d3.median(rpkms)], treatmentRPKMs)

  return (
    h('tr', [
      h(TableCell, ''),

      h(TableCell, gene.label),

      h(TableCell, dashesOrFixed(gene.pValue, 3)),

      h(TableCell, dashesOrFixed(gene.logCPM)),

      h(TableCell, dashesOrFixed(gene.logFC)),

      h(TableCell, dashesOrFixed(treatmentA_RPKMMean)),

      h(TableCell, dashesOrFixed(treatmentA_RPKMMedian)),

      h(TableCell, dashesOrFixed(treatmentB_RPKMMean)),

      h(TableCell, dashesOrFixed(treatmentB_RPKMMedian)),

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
`

const TableHeaderCell = styled.span`
  position: absolute;
  font-weight: bold;
  top: 0;
  bottom: 0;
  left: ${props => props.left}px;
`

class Table extends React.Component {
  constructor() {
    super()

    this.state = {
      width: null,
    }
  }

  componentDidMount() {
    this.refreshSize()
  }

  refreshSize() {
    this.setState({
      width: this.el.querySelector('.table-scroll').clientWidth
    })
  }

  render() {
    const { width } = this.state
        , { brushedGenes, project, comparedTreatments } = this.props.view
        , [ treatmentA, treatmentB ] = (comparedTreatments || [])
        , rpkmA = project.rpkmsForTreatmentGene.bind(null, treatmentA)
        , rpkmB = project.rpkmsForTreatmentGene.bind(null, treatmentB)

    const ready = (width !== null && comparedTreatments !== null) || null
        , columnWidths = ready && calcColumnWidths(width)

    return (
      h(TableWrapper, {
        innerRef: el => { this.el = el }
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
              }
            })
          )),

          h(TableHeaderRow, ready && [
            h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -4))
            }, treatmentA),
            h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -2))
            }, treatmentB),
          ]),

          h(TableHeaderRow, ready && FIELDS.slice(1).map((label, i) =>
            h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, i + 1))
            }, label)
          ))
        ]),

        h(TableBodyWrapper, { className: 'table-scroll' }, [
          h('table', [
            ready && h('colgroup', columnWidths.map((width, i) =>
              h('col', { key: i, width }),
            )),

            h('tbody', ready && [...brushedGenes].map(gene =>
              h(GeneRow, {
                key: `brushed-${gene.label}`,
                saved: false,
                gene,
                treatmentRPKMs: [rpkmA, rpkmB].map(fn => fn(gene.label)),
              })
            )),
          ]),
        ])
      ])
    )
  }
}

module.exports = connect(state => ({
  view: state.currentView,
}))(Table)
