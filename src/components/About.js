"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { connect } = require('react-redux')
    , { Box } = require('rebass')
    , styled = require('styled-components').default
    , ProjectLoading = require('./ProjectLoading')
    , { projectForView } = require('../utils')

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

module.exports = R.pipe(
  connect(state => {
    const project = projectForView(state)

    return {
      documentation: project.readme,
    }
  }),
  ProjectLoading()
)(AboutProject)
