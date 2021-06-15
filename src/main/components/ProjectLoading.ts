import { Route } from 'org-shell'
import { Box, Button } from 'rebass'
import h from 'react-hyperscript'
import * as React from 'react'
import { LogViewer } from '@dredge/log'
import Link from './Link'

import {
  ProjectSource
} from '../types'

import { useAppSelector } from '../hooks'

const { useState } = React

/*
const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , { Box, Button } = require('rebass')
    , Log = require('./Log')
    , { ProjectSource } = require('../types')
    , { Route, useResource, x } = require('org-shell')
    , Link = require('./Link')
  */

function Code(props: any) {
  return h('code', {
    style: {
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc',
      padding: '2px 6px',
    },
    ...props,
  })
}

module.exports = function makeProjectLoading(promptLocal=false) {
  return (Component: React.ComponentType) => {
    const ProjectLoading = (props: any) => {
      const { view, projects } = useAppSelector(state => ({
        view: state.view,
        projects: state.projects,
      }))

      let source: ProjectSource

      if (view) {
        source = view.default.project.source
      } else {
        source = 'global'
      }

      const project = projects[source]!

      // Always prompt to continue if this is a local project
      const [ mustContinue, setMustContinue ] = useState(
        source === 'local' &&
        promptLocal &&
        'loaded' in project &&
        project.loaded
      )

      const showLog = (
        mustContinue ||
        ('loaded' in project && !project.loaded) ||
        ('failed' in project && project.failed)
      )

      const failedGlobal = (
        source === 'global' &&
        ('failed' in project && project.failed)
      )

      if (showLog) {
        return (
          h(Box, { px: 3, py: 2 }, [
            h(LogViewer, {
              loadingProject: source,
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

            !(mustContinue && ('failed' in project && !project.failed)) ? null : h(Box, { mt: 4 }, [
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

    return ProjectLoading
  }
}
