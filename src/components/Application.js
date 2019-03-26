"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { Flex, Box, Button, Heading } = require('rebass')
    , AriaMenuButton = require('react-aria-menubutton')
    , { Navigable, Route } = require('org-shell')
    , { createGlobalStyle } = require('styled-components')
    , { connect } = require('react-redux')
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



const Header = R.pipe(
  connect(R.pick(['projects', 'view'])),
  Navigable
)(function Header({
  navigateTo,
  view,
  projects,
  onRequestResize,
}) {
  const { source } = (view || {})

  let projectLabel
    , hasReadme = false
    , headerText

  if (source) {
    const project = projects[source.key]

    if (project.loaded) {
      projectLabel = R.path([source.key, 'config', 'label'], projects)
      headerText = projectLabel
      hasReadme = !!R.path([source.key, 'config', 'readme'], projects)
    }
  }

  if (!headerText) {
    headerText = 'DrEdGE: Differential Expression Gene Explorer'
  }

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
          (!source || source.key !== 'local') ? null : (
            h(Button, {
              ml: 2,
              onClick() {
                navigateTo(new Route('configure'))
              },
            }, '‹ Return to editing')
          ),
        ]),
      ]),

      h(Flex, { alignItems: 'center' }, [
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
            }

            /*
            else if (val === 'new-project') {
              navigateTo(new Route('new-project'))
            }
            */
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
              }, 'About')),

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

module.exports = class Application extends React.Component {
  constructor() {
    super();

    this.state = Object.assign({
      error: false,
    }, getWindowDimensions())
    this.handleRequestResize = this.handleRequestResize.bind(this)
  }

  handleRequestResize() {
    this.setState(getWindowDimensions(), () => {
      window.dispatchEvent(new Event('application-resize'))
    })
  }

  componentDidCatch(error, info) {
    this.setState({
      componentStack: info.componentStack,
    })
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error, componentStack } = this.state

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

        h('main', [].concat(
          !error
            ? this.props.children
            : (
              h(Box, [
                h(Heading, { as: 'h1'}, 'Runtime error'),
                h(Box, { as: 'pre', mt: 2 }, error.stack),
                !componentStack ? null : h(Box, { as: 'pre' }, '----\n' + componentStack.trim()),
              ])
            )
        )),
      ]),
    ]
  }
}
