"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { typedAsyncActionMiddleware } = require('org-async-actions')
    , { render } = require('react-dom')
    , { applyMiddleware, compose, createStore } = require('redux')
    , { Provider } = require('react-redux')
    , Application = require('./components/Application')
    , reducer = require('./reducer')
    , Action = require('./actions')

function _createStore() {
  let lastTriggeredSort = []

  return createStore(
    reducer,
    compose(
      applyMiddleware(
        typedAsyncActionMiddleware(),
        ({ dispatch, getState }) => next => action => {
          const res = next(action)

          const {
            pairwiseData,
            order,
            sortPath,
            brushedGenes,
            savedGenes,
          } = (getState().currentView || {})

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
              lastTriggeredSort[3] !== brushedGenes ||
              lastTriggeredSort[4] !== savedGenes
            ) {
              dispatch(Action.UpdateDisplayedGenes(null, null))
              lastTriggeredSort = [ pairwiseData, order, sortPath, brushedGenes, savedGenes ]
            }
          }

          return res
        }
      ),
      window.devToolsExtension ? window.devToolsExtension() : a => a
    )
  )
}

render(
  h(Provider, { store: _createStore() }, [
    h(Application),
  ]),
  document.getElementById('application')
)
