import h from 'react-hyperscript'
import * as R from 'ramda'
import { ORGShell, Route } from 'org-shell'
import { Provider } from 'react-redux'
import { render } from 'react-dom'
import { ThemeProvider } from 'styled-components'
import { enableMapSet } from 'immer'

import { actions as projectActions } from './projects'
import createStore from './store'
import { AppDispatch, AppState } from './store'
import theme from './theme'
import Application from './components/Application'

import View from './components/View'

import { Resource } from './types'

enableMapSet()

function loadProject(/* title: string */) {
  return async (
    _: any,
    __: any,
    { dispatch, getState }: { dispatch: AppDispatch, getState: () => AppState }
  ) => {
    await dispatch(projectActions.loadProjectConfig({
      source: { key: 'global' },
    }))

    const project = getState().projects.global

    if ('config' in project) {
      await dispatch(projectActions.loadProject({
        source: { key: 'global' },
      }))
      /*
      dispatch(Action.LoadProject(ProjectSource.Global))
        .then(() => {
          const state = getState()
              , projectKey = R.path(['view', 'source', 'key'], state)

          if (!projectKey) return

          const { label } = state.projects[projectKey].config

          if (!label) return

          dispatch(Action.SetTitle(title ? `${title} - ${label}` : label))
        })
        */
    }
  }
}

const resources: Record<string, Resource> = {
  '': {
    name: 'root',
    onBeforeRoute: (params, redirectTo) => {
      redirectTo(new Route('home'))
    },
    Component: () => null,
  },

    /*
  'help': {
    name: 'help',
    makeTitle: R.always('Help'),
    Component: require('./components/Help'),
  },
  */

  'home': {
    name: 'home',
    makeTitle: R.always('Loading project...'),
    onBeforeRoute: loadProject(),
    Component: View,
    absoluteDimensions: true,
  },

  /*
  'test': {
    name: 'test',
    makeTitle: R.always('Loading project...'),
    onBeforeRoute: async (params, redirectTo, { dispatch, getState }) => {
      const { config } = getState().projects.local

      await dispatch(Action.UpdateLocalConfig(
        R.always({ loaded: false, config })))

      await dispatch(Action.ResetLog('local'))

      dispatch(Action.LoadProject(ProjectSource.Local))
    },
    Component: require('./components/View'),
    absoluteDimensions: true,
  },
  */


  /*
  'about': {
    name: 'about',
    makeTitle: R.always('Loading project...'),
    onBeforeRoute: loadProject('About'),
    Component: require('./components/About'),
  },
  */

 /*
  'configure': {
    name: 'configure',
    makeTitle: R.always('Configure'),
    Component: require('./components/ProjectConfigure'),
  },
  */
}


const store = createStore()

let Main

if (window.location.protocol.startsWith('http')) {
  Main = ORGShell({
    extraArgs: {
      dispatch: store.dispatch,
      getState: store.getState,
    },
    resources,
    onRouteChange(route, resource, { dispatch, getState }) {
      /*
      dispatch(Action.SetTitle(
        resource.makeTitle
          ? resource.makeTitle(getState())
          : null
      ))
      */
    },
  }, Application)
} else {
  Main = Application
}

render(
  h(Provider, { store },
    h(ThemeProvider, { theme },
      h(Main)
    )
  ),
  document.getElementById('application')
)
