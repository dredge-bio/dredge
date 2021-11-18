import { createElement as h } from 'react'
import { Flex, Button, Text } from 'rebass'
import { useView, useViewDispatch, useViewOptions } from '../hooks'
import * as viewActions from '../actions'

export default function Toolbar() {
  const { selectedTranscripts } = useView()
      , dispatch = useViewDispatch()
      , [ , updateOptions ] = useViewOptions()

  return (
    h(Flex, {
      bg: '#f0f0f0',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
    }, ...[
      h('div', null, ...[
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
        }, 'Search'),

        h(Button, {
          mx: 2,
          disabled: selectedTranscripts.size === 0,
          onClick() {
            updateOptions({
              selectedTranscripts: new Set()
            })
            dispatch(viewActions.clearSelectedTranscripts())
          }
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
