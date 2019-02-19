"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { Flex, Box, Button } = require('rebass')
    , AriaMenuButton = require('react-aria-menubutton')
    , { Navigable, Route } = require('org-shell')
    , { createGlobalStyle } = require('styled-components')
    , { connect } = require('react-redux')
    , Action = require('../actions')
    , Log = require('./Log')
    , { version } = require('../../package.json')

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

main {
  padding: .66rem;
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

@font-face {
  font-family: SourceSansPro;
  src: url("lib/SourceSansPro-Regular.otf") format("opentype");
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


const HeaderContainer = styled.header`
  background-color: hsl(205, 35%, 25%);
  background-image: url("data:image/svg+xml,${encodeURIComponent(svg.trim())}");
  height: 100%;
  padding: 0 2em;
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

  width: 200px;
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



const Header = R.pipe(
  connect(state => ({
    projects: state.projects,
    currentView: state.currentView,
  })),
  Navigable
)(class Header extends React.Component {
  constructor() {
    super()

    this.state = {
      isOpen: false,
    }
  }

  render() {
    const { navigateTo } = this.props
        , { isOpen } = this.state
        , currentProject = R.path(['project', 'id'], this.props.currentView)

    return (
      h(HeaderContainer, [
        h('div', { style: { display: 'flex' }}, [
          h('h1', {
            style: {
              fontFamily: 'SourceSansPro',
            },
          }, R.path(['project', 'metadata', 'label'], this.props.currentView) || 'dredge: Differential Expression Transcript Explorer'),
        ]),

        h(Flex, { alignItems: 'center' }, [
          h('div', { style: { position: 'relative', display: 'flex', background: 'white' }}, [
            currentProject && h('label', {
              htmlFor: 'dataset-selector',
            }, 'Dataset:'),

            currentProject && h('select', {
              style: {
                zIndex: 1,
                background: 'transparent',
              },
              id: 'dataset-selector',
              value: currentProject,
              onChange: e => {
                navigateTo(new Route('home', { project: e.target.value }))
              },
            }, Object.keys(this.props.projects || {}).map(key =>
              h('option', {
                key,
                value: key,
              }, this.props.projects[key].metadata.label || key)
            )),
          ]),

          h(AriaMenuButton.Wrapper, {
            style: {
              position: 'relative',
            },
            onSelection: val => {
              if (val === 'help') {
                navigateTo(new Route('help'))
              } else if (val === 'resize') {
                this.props.onRequestResize()
              } else if (val === 'new-project') {
                navigateTo(new Route('new-project'))
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
                h('li', {}, h(AriaMenuButton.MenuItem, {
                  value: 'help',
                }, 'Help')),
                h('li', {}, h(AriaMenuButton.MenuItem, {
                  value: 'resize',
                }, 'Resize to window')),
                h('li', {}, h(AriaMenuButton.MenuItem, {
                  value: 'new-project',
                }, 'Create new project')),

                h(Box, {
                  is: 'li',
                  style: {
                    color: '#666',
                    padding: '1em',
                    borderTop: '1px solid #ccc',
                    fontSize: '12px',
                    textAlign: 'center',
                  },
                }, `DRedGe v${version}`),
              ]),
            ]),
          ])
        ]),

      ])
    )
  }
})

const ApplicationContainer = styled.div`
  display: grid;
  background-color: hsla(45, 31%, 93%, 1);
  grid-template-rows: 64px minmax(600px, 1fr);
`

function getWindowDimensions() {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
  }
}

class Application extends React.Component {
  constructor() {
    super();

    this.state = getWindowDimensions()
    this.handleRequestResize = this.handleRequestResize.bind(this)
  }

  handleRequestResize() {
    this.setState(getWindowDimensions(), () => {
      window.dispatchEvent(new Event('application-resize'))
    })
  }

  render() {
    const { initialized, children } = this.props

    let mainEl

    if (!initialized) {
      mainEl = h(Log)
    } else {
      mainEl = children
    }

    return [
      h(GlobalStyle, { key: 'style' }),
      h(ApplicationContainer, {
        key: 'container',
        style: {
          height: this.state.height,
          width: this.state.width,
        },
      }, [
        h(Header, {
          onRequestResize: this.handleRequestResize,
        }),
        h('main', [].concat(mainEl)),
      ])
    ]
  }
}

module.exports = connect(
  R.pick(['initialized'])
)(Application)
