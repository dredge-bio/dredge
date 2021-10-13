import { createElement as h, useRef } from 'react'
import * as React from 'react'
import * as R from 'ramda'
import { createGlobalStyle } from 'styled-components'
import { Box, Heading } from 'rebass'
import { useResource } from 'org-shell'

import { Resource } from '../types'

import { LogViewer } from '@dredge/log'
import Header from './Header'
import LocalFileMessage from './LocalFileMessage'


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

const MIN_HEIGHT = 700
    , MIN_WIDTH = 1280

type ApplicationSize = {
  resource: Resource | null,
  width: number | null,
  height: number | null,
}

function ApplicationContainer(props: any) {
  const { resource } = useResource()

  const sizeRef = useRef<ApplicationSize>({
    resource: null,
    width: null,
    height: null,
  })

  const absoluteDimensions = !!(
    resource &&
    !!(resource as Resource).absoluteDimensions
  )

  if (sizeRef.current.resource !== resource) {
    if (absoluteDimensions) {
      const newWidth = R.max(window.innerWidth, MIN_WIDTH)
          , newHeight = R.max(window.innerHeight, MIN_HEIGHT)

      sizeRef.current.width = newWidth;
      sizeRef.current.height = newHeight;
    } else {
      sizeRef.current.width = null;
      sizeRef.current.height = null;
    }

    sizeRef.current.resource = resource;
  }

  const style: Partial<CSSStyleDeclaration> = {
    display: 'grid',
    backgroundColor: 'hsla(45, 31%, 93%, 1)',
  }

  if (absoluteDimensions) {
    style.width = sizeRef.current.width! + 'px'
    style.height = sizeRef.current.height! + 'px'
    style.gridTemplateRows = `64px minmax(${MIN_HEIGHT - 64}px, 1fr)`;
    style.gridTemplateColumns = `minmax(${MIN_WIDTH}px, 1fr)`;
  } else {
    style.gridTemplateRows = `64px 1fr`;
  }

  return (
    h('div', {
      ...props,
      style,
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

function Main(props: React.PropsWithChildren<{}>) {
  const { resource } = useResource()
      , { children } = props

  if (resource) {
    return children as unknown as React.ReactElement
  } else {
    return h(Box, { p: 3 }, ...[
      h(LogViewer, {
        source: { key: 'global' },
      }),
    ])
  }
}

export class Application extends React.Component<any, ApplicationState> {
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
        , isLocalFile = window.location.protocol === 'file:'

    let children: React.ReactNode

    if (isLocalFile) {
      children = (
        h(LocalFileMessage)
      )
    } else if (error) {
      children = (
        h(Box, null, ...[
          h(Heading, { as: 'h1'}, 'Runtime error'),
          h(Box, { as: 'pre', mt: 2 }, error.stack),
          !componentStack ? null : h(Box, { as: 'pre' }, '----\n' + componentStack.trim()),
        ])
      )
    } else {
      children = h(Main, null, this.props.children)
    }

    return (
      h(ApplicationContainer, null, ...[
        h(GlobalStyle),

        h(Header, {
          isLocalFile,
          onRequestResize: this.handleRequestResize,
        }),

        h('main', {}, children),
      ])
    )
  }
}
