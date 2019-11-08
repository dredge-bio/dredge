"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , { Box, Button } = require('rebass')
    , Log = require('./Log')
    , { ProjectSource } = require('../types')
    , { Route } = require('org-shell')
    , Link = require('./Link')

function Code({ children }) {
  return h('code', {
    style: {
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc',
      padding: '2px 6px',
    },
  }, children)
}


module.exports = function makeProjectLoading(promptLocal=false) {
  return Component => {
    const ProjectLoading = props => {
      const { view, projects } = props

      let source

      if (view) {
        source = view.source
      } else {
        source = ProjectSource.Global
      }

      const project = projects[source.key]

      // Always prompt to continue if this is a local project
      const [ mustContinue, setMustContinue ] = React.useState(
        project.loaded && promptLocal && source.case({
          Local: R.T,
          Global: R.F,
        }))

      const showLog = (
        mustContinue ||
        project.failed === true ||
        project.loaded === false
      )

      const failedGlobal = project.config === null && source.case({
        Global: R.T,
        _: R.F,
      })

      if (showLog) {
        return (
          h(Box, { px: 3, py: 2 }, [
            h(Log, {
              loadingProject: source.key,
            }),

            !failedGlobal ? null : (
              h(Box, {
                ml: 2,
                mt: 4,
                style: {
                  maxWidth: 720,
                  lineHeight: '22px',
                },
              }, [
                'Could not find a DrEdGE configuration file. If you have not yet created one, continue to the ',
                h(Link, {
                  style: {
                    color: 'blue',
                    fontWeight: 'bold',
                  },
                  route: new Route('configure'),
                }, 'configuration page'),
                '. If you have already created a configuration file, make sure that it is named ',
                h(Code, 'project.json'),
                ' and that it is located in the DrEdGE directory alongside the ',
                h(Code, 'index.html'),
                ' file.',
              ])
            ),

            !(mustContinue && !project.failed) ? null : h(Box, { mt: 4 }, [
              h(Button, {
                onClick() {
                  setMustContinue(false)
                },
              }, 'Continue'),
            ]),
          ])
        )
      }

      return h(Component, props)
    }

    return connect(R.pick(['view', 'projects']))(ProjectLoading)
  }
}
