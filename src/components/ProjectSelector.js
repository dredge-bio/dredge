"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , Action = require('../actions')

function ProjectSelector({ projects, dispatch }) {
  return (
    h('div', [
      h('h2', 'Select a project'),
      h('ul', projects.map(projectBaseURL =>
        h('li', { key: projectBaseURL }, [
          h('a', {
            href: '#',
            onClick(e) {
              e.preventDefault()
              dispatch(Action.ViewProject(projectBaseURL))
            },
          }, projectBaseURL),
        ])
      )),
    ])
  )
}

module.exports = connect(
  store => ({
    projects: Object.keys(store.projects),
  })
)(ProjectSelector)
