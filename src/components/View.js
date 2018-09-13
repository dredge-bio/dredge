"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
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

  ${
    ['selectorA', 'selectorB', 'table', 'pvalue'].map(area => `
      & .grid--${area} {
        grid-area: ${area}
      }`
    ).join('\n')
  }

`

class Viewer extends React.Component {
  constructor() {
    super();

    this.state = {
      sizes: null,
    }
  }

  componentDidMount() {
    this.refreshSize()
  }

  refreshSize() {
    const [ plotEl, tableEl ] = ['plot', 'table'].map(area =>
      this.el.querySelector(`.grid--${area}`))

    this.setState({
      sizes: {
        plot: {
          height: plotEl.clientHeight,
          width: plotEl.clientWidth,
        },
        table: {
          height: tableEl.clientHeight,
          width: tableEl.clientWidth,
        },
      }, })
  }

  render() {
    const { sizes } = this.state
        , { currentView, dispatch } = this.props
        , { comparedTreatments, pairwiseData } = currentView

    let treatmentA, treatmentB

    if (comparedTreatments) {
      [ treatmentA, treatmentB ] = comparedTreatments
    }

    return (
      h(ViewerContainer, {
        innerRef: el => { this.el = el },
      }, [
        h('div.grid--selectorA', [
          h(TreatmentSelector, {
            selectedTreatment: treatmentA,
            handleSelectTreatment: treatment => {
              dispatch(Action.SetPairwiseComparison(treatment, treatmentB))
            },
          }),
        ]),

        h('div.grid--plot', [
          !sizes ? null : h(MAPlot, Object.assign({}, sizes.plot, {
            pairwiseData,
          })),
        ]),

        h('div.grid--pvalue', [
          'P-Value',
        ]),

        h('div.grid--selectorB', [
          h(TreatmentSelector, {
            selectedTreatment: treatmentB,
            handleSelectTreatment: treatment => {
              dispatch(Action.SetPairwiseComparison(treatmentA, treatment))
            },
          }),
        ]),

        h('div.grid--table', [
          !sizes ? null : h(Table, sizes.table),
        ]),
      ])
    )
  }
}

module.exports = connect(R.pick(['currentView']))(Viewer)
