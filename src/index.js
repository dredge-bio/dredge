"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
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
    onBeforeRoute: (params, redirectTo, { getState }) => {
      if (!getState().isGloballyConfigured) {
        redirectTo(new Route('configure'))
      } else {
        redirectTo(new Route('home'))
      }
    },
  },

  'help': {
    makeTitle: R.always('Help'),
    Component: require('./components/Help'),
  },

  'home': {
    makeTitle: R.always('Loading project...'),
    onBeforeRoute: (params, redirectTo, { dispatch, getState }) => {
      if (!getState().isGloballyConfigured) {
        redirectTo(new Route('configure'))
      } else {
        dispatch(Action.LoadProject(ProjectSource.Global))
          .then(() => {
            const state = getState()
                , projectKey = R.path(['view', 'source', 'key'], state)

            if (!projectKey) return

            const { label } = state.projects[projectKey].config

            if (!label) return

            dispatch(Action.SetTitle(label))
          })
      }
    },
    Component: require('./components/View'),
  },

  'configure': {
    makeTitle: R.always('Configure'),
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
  onRouteChange(route, resource, { dispatch, getState }) {
    dispatch(Action.SetTitle(
      resource.makeTitle
        ? resource.makeTitle(getState())
        : null
    ))
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
