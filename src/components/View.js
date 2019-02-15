"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , styled = require('styled-components').default
    , { Navigable, Route } = require('org-shell')
    , MAPlot = require('./MAPlot')
    , TreatmentSelector = require('./TreatmentSelector')
    , Action = require('../actions')
    , Table = require('./Table')
    , WatchedTranscripts = require('./WatchedTranscripts')
    , InfoBox = require('./InfoBox')
    , PValueSelector = require('./PValueSelector')

const ViewerContainer = styled.div`
  display: grid;
  height: 100%;

  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(12, 1fr);
`

const GridArea = styled.div`
  grid-column: ${ props => props.column };
  grid-row: ${ props => props.row };
`

class Viewer extends React.Component {
  async componentDidMount() {
    await this.updateTreatments({})
  }

  async componentDidUpdate(prevProps) {
    await this.updateTreatments(prevProps)
  }

  async updateTreatments(prevProps) {
    const { dispatch, updateOpts, projectKey } = this.props

    let { treatmentA, treatmentB } = this.props

    if (!treatmentA || !treatmentB) {
      const resp = await dispatch(Action.GetDefaultPairwiseComparison(projectKey))
      const { response } = resp.readyState
      treatmentA = response.treatmentA
      treatmentB = response.treatmentB
      updateOpts(opts => Object.assign(opts, { treatmentA, treatmentB }))
      return
    }

    const updateTreatments = (
      treatmentA !== prevProps.treatmentA ||
      treatmentB !== prevProps.treatmentB
    )

    if (updateTreatments) {
      await dispatch(Action.SetPairwiseComparison(treatmentA, treatmentB))
    }
  }

  render() {
    const { dispatch, updateOpts, treatmentA, treatmentB } = this.props

    return (
      h(ViewerContainer, [
        h(GridArea, { column: '1 / span 10', row: '1 / span 2' }, [
          h('div', {
            style: {
              height: '100%',
              width: '100%',
              position: 'relative',
            },
          }, [
            treatmentA && h(TreatmentSelector, {
              useSelectBackup: true,
              tooltipPos: 'bottom',
              selectedTreatment: treatmentA,
              onSelectTreatment: treatment => {
                updateOpts(opts => Object.assign(opts, { treatmentA: treatment }))
              },
            }),
          ]),
        ]),

        h(GridArea, { column: '1 / span 10', row: '11 / span 2' }, [
          h('div', {
            style: {
              height: '100%',
              width: '100%',
              position: 'relative',
            },
          }, [
            treatmentB && h(TreatmentSelector, {
              useSelectBackup: true,
              tooltipPos: 'top',
              selectedTreatment: treatmentB,
              onSelectTreatment: treatment => {
                updateOpts(opts => Object.assign(opts, { treatmentB: treatment }))
              },
            }),
          ]),
        ]),


        h(GridArea, { column: '1 / span 9', row: '3 / span 8', ['data-area']: 'plot' },
          h(MAPlot)
        ),


        h(GridArea, { column: '10 / span 1', row: '3 / span 8' },
          h(PValueSelector),
        ),


        h(GridArea, { column: '12 / span 13', row: '1 / span 9' }, [
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            },
          }, [
            h(WatchedTranscripts),
            h('div', {
              ['data-area']: 'table',

              // This sucks big time
              style: {
                flex: 1,
                maxHeight: 'calc(100% - 84px)',
              },
            }, [
              h(Table),
            ]),
          ]),
        ]),

        h(GridArea, { column: '12 / span 13', row: '10 / span 3' },
          h(InfoBox)
        ),
      ])
    )
  }
}

module.exports = Navigable(Viewer)
