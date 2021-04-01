"use strict";

import h from 'react-hyperscript'
import * as R from 'ramda'
import * as React from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { Flex, Box, Button, Heading } from 'rebass'
import * as AriaMenuButton from 'react-aria-menubutton'
import { connect, useSelector } from 'react-redux'
import * as projectJson from '../../package.json'

import Header from './Header'
import LocalFileMessage from './LocalFileMessage'

import {
  ResourceAware,
  Navigable,
  Route,
  useNavigation,
  useResource
} from 'org-shell'

import Log from './Log'

import {
  DredgeState,
  ProjectSource,
  Resource
} from '../types'

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

function Main(props: React.PropsWithChildren<{}>) {
  const { resource } = useResource()
      , { children } = props

  if (resource) {
    return children as unknown as React.ReactElement
  } else {
    return h(Box, { p: 3 }, [
      h(Log, {
        source: { key: 'global' },
      })
    ])
  }
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
        h(LocalFileMessage)
      )
    } else if (error) {
      children = (
        h(Box, [
          h(Heading, { as: 'h1'}, 'Runtime error'),
          h(Box, { as: 'pre', mt: 2 }, error.stack),
          !componentStack ? null : h(Box, { as: 'pre' }, '----\n' + componentStack.trim()),
        ])
      )
    } else {
      children = React.createElement(Main, null, this.props.children)
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
