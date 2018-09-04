"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , MAPlot = require('./MAPlot')
    , TreatmentSelector = require('./TreatmentSelector')
    , Action = require('../actions')
    , Table = require('./Table')

const ViewerContainer = styled.div`
  display: grid;
  height: 100%;

  grid-template:
      "selectorA selectorA table " 130px
      "plot      pvalue    table " minmax(300px, 1fr)
      "selectorB selectorB table " 130px
    / minmax(500px, 1fr) 100px minmax(500px, 780px)
  ;
`

const GridCell = styled.div`
  grid-area: ${props => props.area};
  border: 1px solid #666;
`

function Viewer(props) {
  const { currentView, dispatch } = props
      , { comparedTreatments, pairwiseData } = currentView

  let treatmentA, treatmentB

  if (comparedTreatments) {
    [ treatmentA, treatmentB ] = comparedTreatments
  }


  return (
    h(ViewerContainer, [
      h(GridCell, { area: 'selectorA', bg: 'lightblue' }, [
        h(TreatmentSelector, {
          selectedTreatment: treatmentA,
          handleSelectTreatment: treatment => {
            dispatch(Action.SetPairwiseComparison(treatment, treatmentB))
          },
        }),
      ]),

      h(GridCell, { area: 'plot', bg: 'lightgreen' }, [
        h(MAPlot, {
          pairwiseData,
        }),
      ]),

      h(GridCell, { area: 'pvalue' }, [
        'P-Value',
      ]),

      h(GridCell, { area: 'selectorB', bg: 'lightblue' }, [
        h(TreatmentSelector, {
          selectedTreatment: treatmentB,
          handleSelectTreatment: treatment => {
            dispatch(Action.SetPairwiseComparison(treatmentA, treatment))
          },
        }),
      ]),

      h(GridCell, {
        area: 'table',
        bg: 'lightpink',
        style: {
          overflowY: 'scroll',
        },
      }, [
        h(Table),
      ]),
    ])
  )
}

module.exports = connect(R.pick(['currentView']))(Viewer)
