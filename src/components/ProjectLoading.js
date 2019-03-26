"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , { Box, Button } = require('rebass')
    , Log = require('./Log')


module.exports = function makeProjectLoading(promptLocal=false) {
  return Component => {
    const ProjectLoading = props => {
      const { view: { source }, projects } = props

      if (!source) return h(Box, {}, null)

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

      if (showLog) {
        return (
          h(Box, { px: 3, py: 2 }, [
            h(Log, {
              loadingProject: source.key,
            }),
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
