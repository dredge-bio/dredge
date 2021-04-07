import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'
import { unwrapResult } from '@reduxjs/toolkit'

import { useViewOptions, useView } from '../view'
import { useAppDispatch } from '../hooks'
import { actions as viewActions } from '../view'

import MAPlot from './MAPlot'
import TreatmentSelector from './TreatmentSelector'
import Table from './Table'

const { useEffect, useState } = React

const ViewerContainer = styled.div`
  display: grid;
  height: 100%;

  padding: .66rem;

  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(12, 1fr);
`

interface GridAreaProps {
  column: string,
  row: string,
  ['data-area']?: string,
}

const GridArea = styled.div<GridAreaProps>`
  position: relative;
  grid-column: ${ props => props.column };
  grid-row: ${ props => props.row };
`

export default function View() {
  const dispatch = useAppDispatch()
      , [ viewOptions, updateViewOptions ] = useViewOptions()
      , { treatmentA, treatmentB } = viewOptions
      , view = useView()

  useEffect(() => {
    dispatch(viewActions.updateSortForTreatments({
      sortPath: view.sortPath,
      order: view.order,
    }))
  }, [ view.pairwiseData ])

  useEffect(() => {
    dispatch(viewActions.updateDisplayedTranscripts())
  }, [
    view.sortedTranscripts,
    view.order,
    view.sortPath,
    view.savedTranscripts,
    view.pValueThreshold,
    view.brushedArea,
    view.selectedBinTranscripts,
  ])

  useEffect(() => {
    if (!treatmentA || !treatmentB) {
      dispatch(viewActions.getDefaultPairwiseComparison())
        .then(unwrapResult)
        .then(({ treatmentA, treatmentB}) => {
          updateViewOptions({
            treatmentA,
            treatmentB,
          })
        })
    } else {
      dispatch(viewActions.setPairwiseComparison({
        treatmentAKey: treatmentA,
        treatmentBKey: treatmentB,
      }))
    }
  }, [treatmentA, treatmentB])

  return (
    h(ViewerContainer, [
      h(GridArea, {
        column: '1 / span 10',
        row: '1 / span 2',
      }, [
        h(TreatmentSelector, {
          useSelectBackup: true,
          selectedTreatment: treatmentA,
          onSelectTreatment: treatment => {
            updateViewOptions({
              treatmentA: treatment,
            })
          },
          tooltipPos: 'bottom' as const,
        }),
      ]),

      h(GridArea, {
        column: '1 / span 10',
        row: '11 / span 2',
      }, [
        h(TreatmentSelector, {
          useSelectBackup: true,
          selectedTreatment: treatmentB,
          onSelectTreatment: treatment => {
            updateViewOptions({
              treatmentB: treatment,
            })
          },
          tooltipPos: 'top' as const,
        }),
      ]),

      h(GridArea, { column: '1 / span 9', row: '3 / span 8', ['data-area']: 'plot' },
        h(MAPlot)
      ),

      h(GridArea, { column: '12 / span 13', row: '1 / span 9' }, [
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
        }, [
          // h(WatchedTranscripts),
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
    ])
  )
}

/*

class Viewer extends React.Component {
  async componentDidMount() {
    await this.updateTreatments({})
    await this.updateView({ opts: {}})
  }

  async componentDidUpdate(prevProps) {
    await this.updateTreatments(prevProps)
    this.updateView(prevProps)

  }

  updateView(prevProps) {
    const { dispatch } = this.props

    if (this.props.opts.p !== prevProps.opts.p) {
      let threshold = parseFloat(this.props.opts.p)

      if (isNaN(threshold)) {
        threshold = 1
      } else if (threshold < 0) {
        threshold = 0
      }

      dispatch(Action.SetPValueThreshold(threshold))
    }

    if (this.props.opts.brushed !== prevProps.opts.brushed) {
      if (this.props.opts.brushed == null) {
        dispatch(Action.SetBrushedArea(null))
        return
      }

      try {
        const coords = decodeURIComponent(this.props.opts.brushed).split(',').map(parseFloat)
        dispatch(Action.SetBrushedArea(coords))
      } catch (e) {
        return;
      }
    }
  }

  async updateTreatments(prevProps) {
    const { dispatch, updateOpts } = this.props

    let { treatmentA, treatmentB } = this.props

    if (!treatmentA || !treatmentB) {
      const resp = await dispatch(Action.GetDefaultPairwiseComparison)
      const { response } = resp.readyState
      treatmentA = response.treatmentA
      treatmentB = response.treatmentB
      updateOpts(opts => Object.assign({}, opts, { treatmentA, treatmentB }))
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
    const { updateOpts, treatmentA, treatmentB, brushExtent } = this.props

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
                updateOpts(opts => Object.assign({}, opts, { treatmentA: treatment }))
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
                updateOpts(opts => Object.assign({}, opts, { treatmentB: treatment }))
              },
            }),
          ]),
        ]),

        h(GridArea, { column: '1 / span 9', row: '3 / span 8', ['data-area']: 'plot' },
          h(MAPlot, { updateOpts, brushExtent })
        ),

        h(GridArea, { column: '10 / span 2', row: '3 / span 8' },
          h(PValueSelector, { updateOpts }),
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
          h(InfoBox, { updateOpts })
        ),
      ])
    )
  }
}

module.exports = R.pipe(
  Navigable,
  connect((state, ownProps) => {
    const { treatmentA, treatmentB, brushed } = ownProps.opts

    return { treatmentA, treatmentB, brushExtent: brushed }
  }),
  ProjectLoading(true)
)(Viewer)
*/
