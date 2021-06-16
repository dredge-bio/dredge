import h from 'react-hyperscript'

import { useView } from '../hooks'

export default function TranscriptInfo() {
  const { hoveredTranscript, focusedTranscript, project } = useView()
      , { transcriptImages } = project.data
      , showTranscript = hoveredTranscript || focusedTranscript

  const images = showTranscript && transcriptImages.get(showTranscript) || null

  return (
    h('div', {
      style: {
        background: '#999',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }, images && images.map(obj =>
      h('img', {
        src: obj.filename,
      })
   ))
  )
}
