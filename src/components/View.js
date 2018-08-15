"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , MAPlot = require('./MAPlot')
    , SampleSelector = require('./SampleSelector')
    , Action = require('../actions')

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
  background-color: ${props => props.bg || null};
`

function Viewer(props) {
  const { currentView, dispatch } = props
      , { comparedSamples, pairwiseData } = currentView

  let sampleA, sampleB

  if (comparedSamples) {
    [ sampleA, sampleB ] = comparedSamples
  }


  return (
    h(ViewerContainer, [
      h(GridCell, { area: 'selectorA', bg: 'lightblue' }, [
        h(SampleSelector, {
          selectedSample: sampleA,
          handleSelectSample: sample => {
            dispatch(Action.SetPairwiseComparison(sample, sampleB))
          }
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
        h(SampleSelector, {
          selectedSample: sampleB,
          handleSelectSample: sample => {
            dispatch(Action.SetPairwiseComparison(sampleA, sample))
          }
        }),
      ]),

      h(GridCell, { area: 'table', bg: 'lightpink' }, [
        'Table',
      ]),
    ])
  )
}

module.exports = connect(R.pick(['currentView']))(Viewer)
