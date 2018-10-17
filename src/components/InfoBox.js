"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , HeatMap = require('./HeatMap')

const InfoBoxContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;

  & > :nth-child(1) {
    padding-top: .5rem;
  }

  & > :nth-child(2) {
    flex-grow: 1;
    position: relative;
  }
`

function InfoBox({
  focusedGene,
  hoveredGene,
  treatments,
  hoveredTreatment,
  comparedTreatments,
}) {
  const gene = hoveredGene || focusedGene || null

  return (
    h(InfoBoxContainer, [
      h('div', [
        gene && h('h3', gene),
      ]),

      h('div', comparedTreatments && [
        h(HeatMap),
      ]),
    ])
  )
}

module.exports = connect(R.applySpec({
  hoveredTreatment: R.path(['currentView', 'hoveredTreatment']),
  comparedTreatments: R.path(['currentView', 'comparedTreatments']),
  focusedGene: R.path(['currentView', 'focusedGene']),
  hoveredGene: R.path(['currentView', 'hoveredGene']),
  treatments: R.path(['currentView', 'project', 'treatments']),
}))(InfoBox)

