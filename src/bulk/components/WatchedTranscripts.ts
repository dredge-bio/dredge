import { createElement as h } from 'react'
import styled from 'styled-components'
import * as React from 'react'
import { Flex, Button } from 'rebass'

import * as viewActions from '../actions'
import { useView, useViewDispatch } from '../hooks'
import { SearchTranscripts, useImportTranscripts } from '@dredge/shared'

const { useState } = React

function union<T>(a: Iterable<T>, b: Iterable<T>) {
  return new Set([...a, ...b])
}

function difference<T>(a: Set<T>, b: Set<T>) {
  const c: Set<T> = new Set()

  a.forEach(x => {
    if (!b.has(x)) c.add(x)
  })

  return c
}

const ButtonContainer = styled.div`
  button:not(:last-of-type) {
    margin-right: 8px;
  }
`

// FIXME: Make this generic across any view
export default function WatchedTranscripts() {
  const view = useView()
      , dispatch = useViewDispatch()

  const {
    project,
    savedTranscripts,
    displayedTranscripts,
  } = view

  const transcripts = displayedTranscripts?.transcripts || []

  const [ showSearch,  setShowSearch] = useState(false)

  const [ importStatusEl, importButtonEl ] = useImportTranscripts(
    project,
    () => {}
    /*
    transcripts => {
      updateOptions({
        selectedTranscripts: new Set(transcripts.map(transcript => transcript[0])),
      })
    }
    */
  )



  return (
    h('div', {
      style: {
        margin: '.75em 0 1em',
        position: 'relative',
      },
    }, ...[
      h('h2', {
        style: {
          fontSize: 16,
          marginBottom: '.25em',
        },
      }, 'Watched transcripts'),

      h(Flex, {
        justifyContent: 'space-between',
      }, [
        h(ButtonContainer, null, ...[
          !showSearch ? null : h(SearchTranscripts, {
            project,
            onSelect: (transcriptName) => {
              const newSavedTranscripts = new Set(savedTranscripts)

              newSavedTranscripts.add(transcriptName)

              dispatch(viewActions.setSavedTranscripts({
                transcriptNames: [...newSavedTranscripts],
              }))

              setShowSearch(true)
            },
          }),

          h(Button, {
            onClick: () => {
              setShowSearch(prev => !prev)
            },
          }, 'Search'),

          h(Button, {
            disabled: transcripts.length === 0,
            onClick() {
              const names = transcripts.map(x => x.name)
                  , newSaved = union(savedTranscripts, new Set(names))

              dispatch(viewActions.setSavedTranscripts({
                transcriptNames: [...newSaved],
              }))
            },
          }, 'Watch selected'),

          h(Button, {
            disabled: transcripts.length === 0,
            onClick() {
              const names = transcripts.map(x => x.name)
                  , newSaved = difference(savedTranscripts, new Set(names))

              dispatch(viewActions.setSavedTranscripts({
                transcriptNames: [...newSaved],
              }))
            },
          }, 'Unwatch selected'),

          h(Button, {
            disabled: savedTranscripts.size === 0,
            onClick() {
              dispatch(viewActions.setSavedTranscripts({
                transcriptNames: [],
              }))
            },
          }, 'Clear'),
        ]),

        h(ButtonContainer, null, ...[
          importButtonEl,

          h(Button, {
            disabled: savedTranscripts.size === 0,
            onClick() {
              dispatch(viewActions.exportSavedTranscripts({ view }))
            },
          }, 'Export'),
        ]),

        importStatusEl,
      ]),
    ])
  )
}
