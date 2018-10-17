"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , HeatMap = require('./HeatMap')
    , TreatmentSelector = require('./TreatmentSelector')

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
        h('div', {
          style: {
            position: 'absolute',
            height: '100%',
            width: '50%',
            left: 0,
          }
        }, [
          h(HeatMap),
        ]),

        gene && h('div', {
          style: {
            position: 'absolute',
            height: '100%',
            width: '50%',
            right: 0,
          }
        }, h(TreatmentSelector, {
          gene,
          tooltipPos: 'top',
          heatmap: true,
          onSelectTreatment(treatment) {
            console.log(treatment)
          },
        })),
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

