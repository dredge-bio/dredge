"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { injectGlobal } = require('styled-components')
    , { connect } = require('react-redux')
    , Action = require('../actions')
    , Log = require('./Log')
    , View = require('./View')
    , ProjectSelector = require('./ProjectSelector')

injectGlobal`
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



const Header = connect(state => ({
  projects: state.projects,
  currentView: state.currentView,
}))(function Header(props) {
  const currentProject = R.path(['project', 'baseURL'], props.currentView)

  return (
    h(HeaderContainer, [
      h('div', { style: { display: 'flex' }}, [
        /* h('button', {
          onClick: props.onRequestResize,
        }, '↻'), */
        h('h1', {
          style: {
            fontFamily: 'SourceSansPro',
          }
        }, R.path(['project', 'metadata', 'label'], props.currentView) || 'dredge: Differential Expression Gene Explorer'),
      ]),

      h('div', { style: { position: 'relative', display: 'flex', background: 'white', }}, [
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
            props.dispatch(Action.ChangeProject(e.target.value))
          },
        }, Object.keys(props.projects || {}).map(key =>
          h('option', {
            key,
            value: key,
          }, key)
        )),
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

class Application extends React.Component {
  constructor() {
    super();

    this.state = getWindowDimensions()
    this.handleRequestResize = this.handleRequestResize.bind(this)
  }

  componentDidMount() {
    const { dispatch } = this.props

    dispatch(Action.Initialize)
  }

  handleRequestResize() {
    this.setState(getWindowDimensions(), () => {
      window.dispatchEvent(new Event('application-resize'))
    })
  }

  render() {
    const { initialized, currentView } = this.props

    let mainEl

    if (!initialized) {
      mainEl = h(Log)
    } else if (!currentView) {
      mainEl = h(ProjectSelector)
    } else {
      mainEl = h(View)
    }

    return h(ApplicationContainer, {
      style: {
        height: this.state.height,
        width: this.state.width,
      }
    }, [
      h(Header, {
        onRequestResize: this.handleRequestResize
      }),
      h('main', [
        mainEl,
      ]),
    ])
  }
}

module.exports = connect(
  R.pick(['initialized', 'currentView'])
)(Application)
