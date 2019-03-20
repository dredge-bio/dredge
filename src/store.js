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

        const {
          pairwiseData,
          order,
          sortPath,
          brushedTranscripts,
          savedTranscripts,
        } = (getState().view || {})

        const triggerResort = (
          action.readyState &&
          action.readyState.case({
            Success: R.T,
            _: R.F,
          }) &&
          action.readyState.response.resort &&
          pairwiseData
        )

        if (triggerResort) {
          if (
            lastTriggeredSort[0] !== pairwiseData ||
            lastTriggeredSort[1] !== order ||
            lastTriggeredSort[2] !== sortPath ||
            lastTriggeredSort[3] !== brushedTranscripts ||
            lastTriggeredSort[4] !== savedTranscripts
          ) {
            dispatch(Action.UpdateDisplayedTranscripts(null, null))
            lastTriggeredSort = [ pairwiseData, order, sortPath, brushedTranscripts, savedTranscripts ]
          }
        }

        return res
      }
    )
  )
}
