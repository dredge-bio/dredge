"use strict";

const h = require('react-hyperscript')
    , createStore = require('./store')
    , { ORGShell, Route } = require('org-shell')
    , { Provider } = require('react-redux')
    , { render } = require('react-dom')
    , { ThemeProvider } = require('styled-components')
    , theme = require('./theme')
    , Application = require('./components/Application')
    , Action = require('./actions')

const resources = {
  '': {
    onBeforeRoute: async (params, redirectTo) => {
      redirectTo(new Route('home'))
    },
  },

  'help': {
    onBeforeRoute: async (params, redirectTo, { dispatch }) => {
      await dispatch(Action.Initialize)
    },
    Component: require('./components/Help'),
  },

  'home': {
    onBeforeRoute: async (params, redirectTo, { dispatch }) => {
      await dispatch(Action.Initialize)

      if (!params.project) {
        const resp = await dispatch(Action.GetDefaultProject)
        const { projectKey } = resp.readyState.response

        redirectTo(new Route('home', { project: projectKey }))
        return
      }

      await dispatch(Action.LoadRemoteProject(params.project))
    },
    Component: require('./components/View'),
  },

  'new-project': {
    Component: require('./components/NewProject'),
  },
}

const store = createStore()

const Main = ORGShell({
  extraArgs: {
    dispatch: store.dispatch,
    getState: store.getState,
  },
  resources,
  onRouteChange(route) {
    // console.log(route)
  },
}, Application)

render(
  h(Provider, { store },
    h(ThemeProvider, { theme },
      h(Main)
    ),
  ),
  document.getElementById('application')
)
