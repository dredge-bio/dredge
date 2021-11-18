import { createElement as h, useState, useEffect } from 'react'
import { Flex, Button, Text } from 'rebass'
import styled from 'styled-components'
import { useView, useViewDispatch, useViewOptions } from '../hooks'
import * as viewActions from '../actions'
import { SearchTranscripts } from '@dredge/shared'
import { Box } from 'rebass'

const ExportDialogContainer = styled(Box)`
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  top: calc(100% - 10px);
  border-radius: 4px;
  box-shadow: 2px 2px 4px #999;
  left: 16px;
  right: 16px;
  z-index: 10;

  label {
    margin-right: 48px;
  }

  .export-grid {
    display: grid;
    grid-template-columns: auto auto auto auto 1fr;
    align-items: center;
  }

  h3 {
    margin-top: 12px;
    margin-bottom: 4px;
    grid-column: 1 / span 5;
  }

  input[disabled] + label {
    color: #666;
    cursor: not-allowed;
  }

  input[disabled] {
    cursor: not-allowed;
  }
`

type ExportDialogProps = {
  hideDialog: () => void;
}

function ExportDialog(props: ExportDialogProps) {
  const { hideDialog } = props
      , id = Math.random().toString()
      , view = useView()
      , { selectedTranscripts, selectedClusters } = view

    /*
     * FIXME: why does the view change on every render?
  useEffect(() => {
    hideDialog()
  }, [ view ])
    */

  const [ transcriptOption, setTranscriptOption ] = useState(
    (selectedTranscripts.size ? 'selected' : 'all') as 'selected' | 'all')

  const [ clusterOption, setClusterOption ] = useState(
    (selectedClusters.size ? 'selected' : 'all') as 'selected' | 'all')

  return (
    h(ExportDialogContainer, {
      p: 3,
    }, ...[
      h('h2', null, 'Export'),

      h(Box, {
        className: 'export-grid',
      }, ...[
        h('h3', null, 'Transcripts'),

        h('input', {
          type: 'radio',
          id: `${id}-selected-transcripts`,
          name: `${id}-transcripts`,
          disabled: selectedTranscripts.size === 0,
          checked: transcriptOption === 'selected',
          onChange() {
            setTranscriptOption('selected')
          },
        }),

        h('label', {
          type: 'radio',
          htmlFor: `${id}-selected-transcripts`,
        }, 'Selected transcripts'),

        h('input', {
          type: 'radio',
          id: `${id}-all-transcripts`,
          name: `${id}-transcripts`,
          checked: transcriptOption === 'all',
          onChange() {
            setTranscriptOption('all')
          },
        }),

        h('label', {
          type: 'radio',
          htmlFor: `${id}-all-transcripts`,
        }, 'All transcripts'),

        h('div'),

        h('h3', null, 'Clusters'),

        h('input', {
          type: 'radio',
          id: `${id}-selected-clusters`,
          name: `${id}-clusters`,
          disabled: selectedClusters.size === 0,
          checked: clusterOption === 'selected',
          onChange() {
            setClusterOption('selected')
          },
        }),

        h('label', {
          type: 'radio',
          htmlFor: `${id}-selected-clusters`,
        }, 'Selected clusters'),

        h('input', {
          type: 'radio',
          id: `${id}-all-clusters`,
          name: `${id}-clusters`,
          checked: clusterOption === 'all',
          onChange() {
            setClusterOption('all')
          },
        }),

        h('label', {
          type: 'radio',
          htmlFor: `${id}-all-clusters`,
        }, 'All clusters'),
      ]),

      h(Box, {
        mt: 3,
        className: 'export-buttons',
      }, ...[
        h(Button, {
          mr: 2,
          style: {
            backgroundColor: 'blue',
            color: 'white',
          },
        }, 'Export'),

        h(Button, {
          onClick() {
            hideDialog()
          },
          style: {
            backgroundColor: 'red',
            color: 'white',
          },
        }, 'Cancel'),
      ]),
    ])
  )
}

export default function Toolbar() {
  const { selectedTranscripts, project } = useView()
      , dispatch = useViewDispatch()
      , [ , updateOptions ] = useViewOptions()
      , [ showSearch, setShowSearch ] = useState(false)
      , [ showExport, setShowExport ] = useState(false)

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

        !showExport ? null : h(ExportDialog, {
          hideDialog: () => {
            setShowExport(false)
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
          onClick() {
            setShowExport(prev => !prev)
          },
        }, 'Export'),

        h(Button, {
          mx: 2,
        }, 'Import'),
      ]),
    ])
  )
}
