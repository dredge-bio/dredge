"use strict";

const R = require('ramda')
    , d3 = require('d3')
    , h = require('react-hyperscript')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')

const TableCell = styled.td`
  padding: 2px 0;
`

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

const FIELDS = [
  ['save', ' '],
  ['geneName', 'Gene'],
  ['pValue', 'P-Value'],
  ['logCPM', 'Log CPM'],
  ['logFC', 'Log FC'],
  ['cellARPKMAvg', 'Mean RPKM'],
  ['cellARPKMMed', 'Med. RPKM'],
  ['cellBRPKMAvg', 'Mean RPKM'],
  ['cellBRPKMMed', 'Med. RPKM'],
]

const TableWrapper = styled.table`
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  background-color: white;

  & tbody, & thead {
    display: block;
    width: 100%;
  }

  & td, & th {
    border: 1px solid black;
    width: 100px;
    overflow-x: hidden;
  }

  & thead {
    height: 50px;
    background-color: #eee;
  }

  & tbody {
    height: calc(100% - 50px);
    overflow-y: scroll;
  }
`



function Table({ view }) {
  if (!view.comparedTreatments) return null

  const { brushedGenes, project, comparedTreatments } = view

  const [ treatmentA, treatmentB ] = comparedTreatments
      , rpkmA = project.rpkmsForTreatmentGene.bind(null, treatmentA)
      , rpkmB = project.rpkmsForTreatmentGene.bind(null, treatmentB)

  return (
    h('div', { style: { height: '100%' }}, [
      h(TableWrapper, [
        h('thead', {}, h('tr', FIELDS.map(([key, label]) =>
          h('th', {
            key,
          }, label)
        ))),

        h('tbody', [...brushedGenes].map(gene =>
          h(GeneRow, {
            key: `brushed-${gene.label}`,
            saved: false,
            gene,
            treatmentRPKMs: [rpkmA, rpkmB].map(fn => fn(gene.label)),
          })
        )),
      ]),
    ])
  )
}

module.exports = connect(state => ({
  view: state.currentView,
}))(Table)
