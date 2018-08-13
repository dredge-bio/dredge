"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , MAPlot = require('./MAPlot')

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
  const { currentView } = props
      , { comparedSamples, pairwiseData } = currentView

  let cellA, cellB

  if (comparedSamples) {
    [ cellA, cellB ] = comparedSamples
  }


  return (
    h(ViewerContainer, [
      h(GridCell, { area: 'selectorA', bg: 'lightblue' }, [
        cellA,
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
        cellB,
      ]),

      h(GridCell, { area: 'table', bg: 'lightpink' }, [
        'Table',
      ]),
    ])
  )
}

module.exports = connect(R.pick(['currentView']))(Viewer)
