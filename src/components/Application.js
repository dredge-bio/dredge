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


function Header() {
  return (
    h(styled.header`
      background-color: lightgreen;
      height: 100%;
      padding: 0 1em 0 1em;
      display: flex;
      align-items: center;
    `, [
      h('div', [
        'Heading',
      ]),
    ])
  )
}

const ApplicationContainer = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  background-color: bisque;
  grid-template-rows: 50px minmax(600px, 1fr);
`

class Application extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props

    dispatch(Action.Initialize)
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

    return h(ApplicationContainer, [
      h(Header),
      h('main', [
        mainEl,
      ]),
    ])
  }
}

module.exports = connect(
  R.pick(['initialized', 'currentView'])
)(Application)
