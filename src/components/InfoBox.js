"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , HeatMap = require('./HeatMap')

const InfoBoxContainer = styled.div`
  display: flex;
  height: 100%;
  justify-content: space-between;

  & > :first-child {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  & > :nth-child(2) {
  }
`

function InfoBox({
  focusedGene,
  treatments,
  hoveredTreatment,
  comparedTreatments,
}) {
  return (
    h(InfoBoxContainer, [
      h('div', {},
        hoveredTreatment
          ? h('h2', treatments[hoveredTreatment].label)
          : comparedTreatments
            ? [
                h('h2', `▲ ${comparedTreatments[0]}`),
                h('h2', `▼ ${comparedTreatments[1]}`),
              ]
            : null
      ),

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
  treatments: R.path(['currentView', 'project', 'treatments']),
}))(InfoBox)

