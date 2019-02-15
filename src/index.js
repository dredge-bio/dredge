"use strict";

const h = require('react-hyperscript')
    , createStore = require('./store')
    , { ORGShell, Route } = require('org-shell')
    , { render } = require('react-dom')
    , Application = require('./components/Application')
    , Action = require('./actions')

const resources = {
  '': {
    onBeforeRoute: async (dispatch, params, redirectTo) => {
      redirectTo(new Route('home'))
    },
  },

  'home': {
    onBeforeRoute: async (dispatch, params, redirectTo) => {
      await dispatch(Action.Initialize)

      if (!params.project) {
        const resp = await dispatch(Action.GetDefaultProject)
        const { projectKey } = resp.readyState.response

        redirectTo(new Route('home', { project: projectKey }))
        return
      }

      await dispatch(Action.ViewProject(params.project))
    },
    mapStateToProps: (state, ownProps) => {
      const { treatmentA, treatmentB } = ownProps.opts
          , projectKey = ownProps.params.project

      return { projectKey, treatmentA, treatmentB }
    },
    Component: require('./components/View'),
  },

  'project-browse': {
    onBeforeRoute: async (dispatch) => {
      dispatch(Action.Initialize)
    },
  },
}

const Main = ORGShell({
  createStore,
  resources,
  onRouteChange(route, store) {
    // console.log(route)
  },
}, Application)

render(
  h(Main),
  document.getElementById('application')
)
