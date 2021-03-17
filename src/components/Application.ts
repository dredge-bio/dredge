"use strict";

import h from 'react-hyperscript'
import * as R from 'ramda'
import * as React from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { Flex, Box, Button, Heading } from 'rebass'
import * as AriaMenuButton from 'react-aria-menubutton'
import { Navigable, Route, useNavigation, useResource } from 'org-shell'
import { connect, useSelector } from 'react-redux'
import * as projectJson from '../../package.json'

import Log from './Log'

import {
  DredgeState,
  ProjectSource,
  Resource
} from '../ts_types'

const { version } = projectJson

const GlobalStyle = createGlobalStyle`
html, body, #application {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: hsla(45, 31%, 93%, 1);
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
  margin-top: 0;
  margin-bottom: 0;
  font-family: sans-serif;
}

pre {
  font-family: monospace;
}

`

// Adapted from https://www.heropatterns.com/
const svg = `
<svg
  width="42"
  height="24"
  viewBox="0 0 84 48" xmlns="http://www.w3.org/2000/svg">

  <path
    fill="white"
    fill-opacity=".05"
    fill-rule="evenodd"
    d="
      M0
      0h12v6H0V0zm28
      8h12v6H28V8zm14-8h12v6H42V0zm14
      0h12v6H56V0zm0
      8h12v6H56V8zM42
      8h12v6H42V8zm0
      16h12v6H42v-6zm14-8h12v6H56v-6zm14
      0h12v6H70v-6zm0-16h12v6H70V0zM28
      32h12v6H28v-6zM14
      16h12v6H14v-6zM0
      24h12v6H0v-6zm0
      8h12v6H0v-6zm14
      0h12v6H14v-6zm14
      8h12v6H28v-6zm-14
      0h12v6H14v-6zm28
      0h12v6H42v-6zm14-8h12v6H56v-6zm0-8h12v6H56v-6zm14
      8h12v6H70v-6zm0
      8h12v6H70v-6zM14
      24h12v6H14v-6zm14-8h12v6H28v-6zM14
      8h12v6H14V8zM0
      8h12v6H0V8z
    "
  />
</svg>
`


const HeaderContainer = styled(Box)`
  background-color: hsl(205, 35%, 25%);
  background-image: url("data:image/svg+xml,${encodeURIComponent(svg.trim())}");
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  & h1 {
    color: white;
    font-size: 28px;
    letter-spacing: .6px;
  }

  & select, & label {
    display: inline-block;
    height: 36px;
    border: 0;
    font-size: 16px;
    padding: 6px 1em;
  }

  & label {
    line-height: 24px;
    background-color: #ddd;
    font-weight: bold;
    border-radius: 3px 0 0 3px;
  }

  & select {
    padding-right: 2em;
    appearance: none;
    background-color: #fafafa;
    font-family: SourceSansPro;
    border-radius: 0 3px 3px 0;
  }

  & label::after {
    position: absolute;
    right: 8px;
    content: "▼";
    font-size: 12px;
  }
`


const Menu = styled(AriaMenuButton.Menu)`
  position: absolute;
  top: 42px;
  right: 0;
  z-index: 1;

  width: ${props => props.width || '240px'};
  box-shadow: -1px 1px 8px #888;

  border: 1px solid #ccc;
  background-color: white;

  ul {
    padding: 0;
    list-style-type: none;
  }

  [role="menuitem"] {
    cursor: pointer;
    padding: .5em 1em;
  }

  [role="menuitem"]:hover,
  [role="menuitem"]:focus {
    background-color: #ccc;
  }
`

const LocalFileContainer = styled(Box)`
p, ul {
  margin-bottom: 1.3rem;
}

h1, li {
  margin-bottom: 1rem;
}

code {
  font-family: monospace;
  font-size: 16px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 4px;
}
`

interface HeaderProps {
  onRequestResize: () => void;
  isLocalFile: boolean;
}

function selector(state: DredgeState) {
  return {
    view: state.view,
    projects: state.projects,
  }
}

function Header(props: HeaderProps){ 
  const { onRequestResize, isLocalFile } = props
      , { view, projects } = useSelector(selector)
      , navigateTo = useNavigation()

  let projectLabel = ''
    , hasReadme = false
    , headerText = ''

  if (view) {
    const project = projects[view.source.key]

    if (project && project.loaded) {
      projectLabel = project.config.label
      headerText = projectLabel
      hasReadme = !!project.config.readme
    }
  }

  if (!headerText) {
    headerText = 'DrEdGE: Differential Expression Gene Explorer'
  }

  // FIXME: is this a typo?
  const hasProjectReadme = view && view.source && projects

  return (
    h(HeaderContainer, {
      as: 'header',
      px: 4,
    }, [
      h('div', { style: { display: 'flex' }}, [
        h('h1', {
          style: {
            display: 'flex',
            fontFamily: 'SourceSansPro',
          },
        }, [
          headerText,
          (!view || view.source.key !== 'local') ? null : (
            h(Button, {
              ml: 2,
              onClick() {
                navigateTo(new Route('configure'))
              },
            }, '‹ Return to editing')
          ),
        ]),
      ]),

      isLocalFile ? null : h(Flex, { alignItems: 'center' }, [
        h(AriaMenuButton.Wrapper, {
          style: {
            position: 'relative',
          },
          onSelection: val => {
            if (val === 'home') {
              navigateTo(new Route('home'))
            } else if (val === 'help') {
              navigateTo(new Route('help'))
            } else if (val === 'resize') {
              onRequestResize()
            } else if (val === 'about') {
              navigateTo(new Route('about'))
            } else if (val === 'dredge-home') {
              window.location.href = 'http://dredge.bio.unc.edu'
            }
          },
        }, [
          h(Button, {
            ml: 2,
            style: {
              padding: 0,
            },
          }, [
            h(AriaMenuButton.Button, {
              style: {
                fontSize: '16px',
                padding: '9px 14px',
                display: 'inline-block',
              },
            }, 'Menu'),
          ]),

          h(Menu, [
            h('ul', [
              !projectLabel ? null : h(Box, {
                is: 'li',
                style: {
                  color: '#666',
                  padding: '.5rem 1rem .5rem 1rem',
                  fontSize: '14px',
                },
              }, projectLabel),

              h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'home',
              }, projectLabel ? 'View' : 'Home')),

              !hasReadme ? null : h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'about',
              }, 'About dataset')),

              !projectLabel ? null : h(Box, {
                is: 'li',
                style: {
                  color: '#666',
                  borderBottom: '1px solid #ccc',
                  fontSize: '14px',
                },
              }),

              h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'resize',
              }, 'Resize application to window')),

              h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'help',
              }, 'About DrEdGE')),

              h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'dredge-home',
              }, 'DrEdGE project homepage')),

              h(Box, {
                is: 'li',
                style: {
                  color: '#666',
                  padding: '1em',
                  borderTop: '1px solid #ccc',
                  fontSize: '12px',
                  textAlign: 'center',
                },
              }, `DrEdGE v${version}`),
            ]),
          ]),
        ]),
      ]),

    ])
  )
}

const MIN_HEIGHT = 700
    , MIN_WIDTH = 1280

interface ApplicationContainerExtraProps {
  absoluteDimensions?: boolean;
}

function ApplicationContainer(props: any) {
  const { resource } = useResource()

  const absoluteDimensions = !!(
    resource &&
    !!(resource as Resource).absoluteDimensions
  )

  // FIXME: probably the wrong typing here
  const style: Partial<CSSStyleDeclaration> = {
    display: 'grid',
    backgroundColor: 'hsla(45, 31%, 93%, 1)',
  }

  if (absoluteDimensions) {
    style.gridTemplateRows = `64px minmax(${MIN_HEIGHT - 64}px, 1fr)`;
    style.gridTemplateColumns = `minmax(${MIN_WIDTH}px, 1fr)`;
  } else {
    style.gridTemplateRows = `64px 1fr`;
  }

  return (
    h('div', {
      ...props,
      style
    })
  )
}

function getWindowDimensions() {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
  }
}

interface ApplicationState {
  width: number;
  height: number;
  error: Error | null;
  componentStack: string | null;
}

export default class Application extends React.Component<any, ApplicationState> {
  constructor(props: any) {
    super(props);

    const { width, height } = getWindowDimensions()

    this.state = {
      width,
      height,
      error: null,
      componentStack: null,
    }

    this.handleRequestResize = this.handleRequestResize.bind(this)
  }

  handleRequestResize() {
    this.setState(prevState => {
      return {
        ...prevState,
        ...getWindowDimensions(),
      }
    }, () => {
      window.dispatchEvent(new Event('application-resize'))
    })
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({
      componentStack: info.componentStack,
    })
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error, componentStack } = this.state
        , { activeResource } = this.props
        , isLocalFile = window.location.protocol === 'file:'

    let children: React.ReactNode

    if (isLocalFile) {
      children = (
        h(LocalFileContainer, {
          p: 4,
          style: {
            maxWidth: 720,
          },
        }, [
          h(Heading, { as: 'h1' }, [
            'Setup',
          ]),

          h('p', [
            `
            You have loaded DrEdGE without using a Web server. While DrEdGE is designed to work
            with all local files, it must be served from a Web server to function.
            To run one on your local machine using Python, run one of the following commands
            in the directory where you extracted DrEdGE:
            `,
          ]),

          h('ul', [
            h('li', [
              h('b', 'Python 3: '),
              h('code', 'python3 -m http.server 8006'),
            ]),
            h('li', [
              h('b', 'Python 2: '),
              h('code', 'python -m SimpleHTTPServer 8006'),
            ]),
          ]),

          h('p', [
            'Then open the page ',
            h('a', { href: 'http://127.0.0.1:8006' }, 'http://127.0.0.1:8006'),
            '.',
          ]),
        ])
      )
    } else if (error) {
      children = (
        h(Box, [
          h(Heading, { as: 'h1'}, 'Runtime error'),
          h(Box, { as: 'pre', mt: 2 }, error.stack),
          !componentStack ? null : h(Box, { as: 'pre' }, '----\n' + componentStack.trim()),
        ])
      )
    } else if (!activeResource) {
      children = (
        h(Box, { p: 3 }, [
          h(Log, { source: ProjectSource.Global }),
        ])
      )
    } else {
      children = this.props.children
    }

    return [
      h(ApplicationContainer, {
        key: 'container',
        /*
        style: !absoluteDimensions ? null : {
          height: this.state.height,
          width: this.state.width,
        },
        */
      }, [
        h(GlobalStyle),

        h(Header, {
          isLocalFile,
          onRequestResize: this.handleRequestResize,
        }),

        React.createElement('main', {}, children),
      ]),
    ]
  }
}
