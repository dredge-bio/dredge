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

function loadProject(title) {
  return (params, redirectTo, { dispatch, getState }) => {
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

          dispatch(Action.SetTitle(title ? `${title} - ${label}` : label))
        })
    }
  }
}

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
    onBeforeRoute: loadProject(),
    Component: require('./components/View'),
    absoluteDimensions: true,
  },

  'test': {
    makeTitle: R.always('Loading project...'),
    onBeforeRoute: async (params, redirectTo, { dispatch, getState }) => {
      const { config } = getState().projects.local

      await dispatch(Action.UpdateLocalConfig(
        R.always({ loaded: false, config })))

      await dispatch(Action.ResetLog('local'))

      dispatch(Action.LoadProject(ProjectSource.Local))
    },
    Component: require('./components/View'),
  },


  'about': {
    makeTitle: R.always('Loading project...'),
    onBeforeRoute: loadProject('About'),
    Component: require('./components/About'),
  },

  'configure': {
    makeTitle: R.always('Configure'),
    Component: require('./components/ProjectConfigure'),
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
