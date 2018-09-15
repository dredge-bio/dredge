"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Action = require('../../actions')

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


function GeneRow({
  data,
  addSavedGene,
  removeSavedGene,
  columnWidths,
}) {
  return (
    h('tr', [
      h(TableCell, [
        h(SaveMarker, {
          href: '',
          saved: data.saved,
          onClick(e) {
            e.preventDefault()

            if (data.saved) {
              removeSavedGene(data.gene)
            } else {
              addSavedGene(data.gene)
            }

          },
        }, data.saved ? '×' : '<'),
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
      sortBy: FIELDS[1].sortPath,
      order: 'asc',
    }
  }

  componentDidMount() {
    this.refreshSize()
  }

  getDisplayedGenes() {
    const { sortBy, order } = this.state
        , { project, savedGenes, brushedGenes, comparedTreatments } = this.props.view
        , { rpkmsForTreatmentGene } = project
        , [ treatmentA, treatmentB ] = comparedTreatments

    const listedGenes = brushedGenes.size
      ? brushedGenes
      : savedGenes

    const genes = [...listedGenes].map(gene => {
      const [
        treatmentA_RPKMMean,
        treatmentA_RPKMMedian,
        treatmentB_RPKMMean,
        treatmentB_RPKMMedian,
      ] = R.chain(
        rpkms => [d3.mean(rpkms), d3.median(rpkms)],
        [rpkmsForTreatmentGene(treatmentA, gene.label), rpkmsForTreatmentGene(treatmentB, gene.label)]
      )

      return {
        gene,
        saved: savedGenes.has(gene),
        treatmentA_RPKMMean,
        treatmentA_RPKMMedian,
        treatmentB_RPKMMean,
        treatmentB_RPKMMedian,
      }
    })


    return R.sort(
      (order === 'asc' ? R.ascend : R.descend)(R.path(sortBy)),
      genes
    )
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

  refreshSize() {
    this.setState({
      width: this.el.querySelector('.table-scroll').clientWidth,
    })
  }

  render() {
    const { width, sortBy, order } = this.state
        , { dispatch, view } = this.props
        , { comparedTreatments, savedGenes } = view
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
            h('div', {
              style: {
                marginLeft: 24,
              },
            }, this.getDisplayMessage()),

            h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -4)),
            }, treatmentA),
            h(TableHeaderCell, {
              left: R.sum(columnWidths.slice(0, -2)),
            }, treatmentB),
          ]),

          h(TableHeaderRow, ready && FIELDS.slice(1).map(({ label, sortPath }, i) =>
            h(TableHeaderCell, {
              key: i,
              left: R.sum(columnWidths.slice(0, i + 1)),
              clickable: true,
              onClick: () => {
                this.setState(prev => ({
                  sortBy: sortPath,
                  order: prev.sortBy === sortPath
                    ? order === 'asc' ? 'desc' : 'asc'
                    : 'asc',
                }))
              },
            }, [
              label,
              sortPath === sortBy
                ? h('span', {
                    style: {
                      position: 'relative',
                      fontSize: 10,
                      top: -1,
                      left: 1,
                    },
                  }, order === 'asc' ? ' ▾' : ' ▴')
                : null,
            ])
          )),
        ]),

        h(TableBodyWrapper, { className: 'table-scroll' }, [
          h('table', [
            ready && h('colgroup', columnWidths.map((width, i) =>
              h('col', { key: i, width }),
            )),

            h('tbody', ready && this.getDisplayedGenes().map(data =>
              h(GeneRow, {
                key: `brushed-${data.gene.label}`,
                saved: false,
                columnWidths,
                addSavedGene(gene) {
                  const newSavedGenes = new Set(savedGenes)

                  newSavedGenes.add(gene)

                  dispatch(Action.SetSavedGenes(newSavedGenes))
                },
                removeSavedGene(gene) {
                  const newSavedGenes = new Set(savedGenes)

                  newSavedGenes.delete(gene)

                  dispatch(Action.SetSavedGenes(newSavedGenes))
                },
                data,
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
