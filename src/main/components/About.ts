import { createElement as h } from 'react'
import styled from 'styled-components'
import { Box } from 'rebass'

import { useProject } from '../hooks'


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

export default function AboutProject() {
  const project = useProject('global')

  return (
    h(DocumentationContainer, {
      px: 4, py: 2,
      dangerouslySetInnerHTML: {
        __html: project.data.readme || '',
      },
    })
  )
}
