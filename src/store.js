"use strict";

const R = require('ramda')
    , { typedAsyncActionMiddleware } = require('org-async-actions')
    , { applyMiddleware, createStore } = require('redux')
    , reducer = require('./reducer')
    , Action = require('./actions')


module.exports = function _createStore() {
  let lastTriggeredSort = []

  return createStore(
    reducer,
    applyMiddleware(
      typedAsyncActionMiddleware(),
      ({ dispatch, getState }) => next => action => {
        const res = next(action)

        const updateSort = (
          action.readyState &&
          action.readyState.case({
            Success: R.T,
            _: R.F,
          }) &&
          action.type._name === 'SetPairwiseComparison'
        )

        if (updateSort) {
          dispatch(Action.UpdateSortForTreatments(null, null))
          return res
        }

        const {
          // pairwiseData,
          sortedTranscripts,
          order,
          sortPath,
          savedTranscripts,
          pValueThreshold,
          brushedArea,
          selectedBinTranscripts,
          hoveredBinTranscripts,
        } = (getState().view || {})

        const checkResort = (
          action.readyState &&
          action.readyState.case({
            Success: R.T,
            _: R.F,
          }) &&
          action.readyState.response.resort &&
          // pairwiseData &&
          sortedTranscripts
        )

        if (checkResort) {
          const triggerResort = (
            // lastTriggeredSort.pairwiseData !== pairwiseData ||
            lastTriggeredSort.sortedTranscripts !== sortedTranscripts ||
            lastTriggeredSort.order !== order ||
            lastTriggeredSort.sortPath !== sortPath ||
            lastTriggeredSort.savedTranscripts !== savedTranscripts ||
            lastTriggeredSort.pValueThreshold !== pValueThreshold ||
            lastTriggeredSort.brushedArea !== brushedArea ||
            lastTriggeredSort.selectedBinTranscripts !== selectedBinTranscripts ||
            (
              selectedBinTranscripts === null &&
              lastTriggeredSort.hoveredBinTranscripts !== hoveredBinTranscripts
            )
          )

          if (!triggerResort) return

          dispatch(Action.UpdateDisplayedTranscripts(null, null))
          lastTriggeredSort = {
            // pairwiseData,
            sortedTranscripts,
            order,
            sortPath,
            savedTranscripts,
            pValueThreshold,
            brushedArea,
            selectedBinTranscripts,
            hoveredBinTranscripts,
          }
        }

        return res
      }
    )
  )
}
