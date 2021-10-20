import { createElement as h } from 'react'
import TranscriptImages from './Images'
import styled from 'styled-components'
import { useView } from '../../hooks'
import { Box } from 'rebass'

const InfoContainer = styled.div`
  height: 100%;

  display: grid;
  grid-template-rows: auto 1fr;
`

function CurrentTranscript() {
  const { hoveredTranscript, focusedTranscript } = useView()
      , showTranscript = hoveredTranscript || focusedTranscript

  return (
    h(Box, {
      bg: '#fafafa',
      fontWeight: 'bold',
      fontSize: 3,
      textAlign: 'center',
      p: 2,
      style: {
        borderBottom: '1px solid #ccc',
      },
    }, showTranscript || ' ' /* <--- u00A0 (non-breakable space) */)
  )
}

export default function TranscriptInfo() {
  return (
    h(InfoContainer, null, ...[
      h(CurrentTranscript),

      h(TranscriptImages),
    ])
  )
}
