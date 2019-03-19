"use strict";

const h = require('react-hyperscript')
    , createStore = require('./store')
    , { ORGShell, Route } = require('org-shell')
    , { Provider } = require('react-redux')
    , { render } = require('react-dom')
    , { ThemeProvider } = require('styled-components')
    , { ProjectSource } = require('./types')
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
    Component: require('./components/Help'),
  },

  'home': {
    onBeforeRoute: async (params, redirectTo, { dispatch }) => {
      dispatch(Action.LoadProject(ProjectSource.Global))
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
  onRouteChange(route, { dispatch }) {
    if (route.resourceName !== 'home') {
      // dispatch(Action.ResetViewedProject)
    }
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
