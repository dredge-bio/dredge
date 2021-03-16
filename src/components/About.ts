"use strict";

import * as h from 'react-hyperscript'
import * as R from 'ramda'
import styled from 'styled-components'
import { connect, ConnectedProps } from 'react-redux'
import { Box } from 'rebass'
import ProjectLoading from './ProjectLoading'

import { projectForView } from '../utils'
import { DredgeState } from '../ts_types'


const DocumentationContainer = styled(Box)`
  max-width: 800px;
  margin: auto;
  line-height: 20px;

  h1, h2, h3, h4, h5, h6 {
    padding-bottom: 1rem;
  }

  p {
    padding-bottom: 1rem;
 }
`

function AboutProject(props) {
  return (
    h(DocumentationContainer, {
      px: 4, py: 2,
      dangerouslySetInnerHTML: {
        __html: props.documentation
      }
    })
  )
}

function mapStateToProps(state: DredgeState) {
  const project = projectForView(state)

  return {
    documentation: project.readme || '',
  }
}

module.exports = R.pipe(
  mapStateToProps,
  ProjectLoading()
)(AboutProject)
