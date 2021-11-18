import { createElement as h, useState } from 'react'
import { Flex, Button, Text } from 'rebass'
import { useView, useViewDispatch, useViewOptions } from '../hooks'
import * as viewActions from '../actions'
import { SearchTranscripts } from '@dredge/shared'

export default function Toolbar() {
  const { selectedTranscripts, project } = useView()
      , dispatch = useViewDispatch()
      , [ , updateOptions ] = useViewOptions()
      , [ showSearch, setShowSearch ] = useState(false)

  return (
    h(Flex, {
      bg: '#f0f0f0',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    }, ...[
      h('div', null, ...[
        !showSearch ? null : h(SearchTranscripts, {
          project,
          onSelect(transcriptID) {
            const newSelectedTranscripts = new Set(selectedTranscripts)

            newSelectedTranscripts.add(transcriptID)

            dispatch(viewActions.setSelectedTranscripts({ transcripts: newSelectedTranscripts }))
            dispatch(viewActions.setFocusedTranscript({ transcript: transcriptID }))

            updateOptions({
              selectedTranscripts: newSelectedTranscripts,
            })
          },
        }),

        h(Text, {
          mx: 2,
          fontWeight: 'bold',
          display: 'inline-block',
        }, 'Selected transcripts:'),

        h(Text, {
          style: {
            width: '3ch',
          },
          ml: -1,
          fontWeight: 'bold',
          display: 'inline-block',
        }, selectedTranscripts.size),

        h(Button, {
          mx: 2,
          onClick() {
            setShowSearch(prev => !prev)
          },
        }, 'Search'),

        h(Button, {
          mx: 2,
          disabled: selectedTranscripts.size === 0,
          onClick() {
            updateOptions({
              selectedTranscripts: new Set(),
            })
            dispatch(viewActions.clearSelectedTranscripts())
          },
        }, 'Clear'),

      ]),

      h('div', null, ...[
        h(Button, {
          mx: 2,
        }, 'Export'),

        h(Button, {
          mx: 2,
        }, 'Import'),
      ]),
    ])
  )
}
