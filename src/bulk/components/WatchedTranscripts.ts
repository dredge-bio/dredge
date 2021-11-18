import { createElement as h } from 'react'
import styled from 'styled-components'
import * as React from 'react'
import { Flex, Box, Button } from 'rebass'
import { unwrapResult } from '@reduxjs/toolkit'

import * as viewActions from '../actions'
import { useView, useViewDispatch } from '../hooks'
import { readFile, FileInput } from '@dredge/main'
import { SearchTranscripts } from '@dredge/shared'

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

const StatusContainer = styled.div`
  position: absolute;
  z-index: 1;

  top: 0; bottom: 0; left: 0; right: 0;

  padding: 2em;

  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
`

type WatchedTranscriptsState = {
  showSearch: boolean;
  importStatus: React.ReactElement | null;
}


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

  const [{
    showSearch,
    importStatus,
  }, setState] = useState<WatchedTranscriptsState>({
    showSearch: false,
    importStatus: null,
  })

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return

    const text = await readFile(files[0]!)

    try {
      const resp = await dispatch(viewActions.importSavedTranscripts({
        text,
      })).then(unwrapResult)

      const { imported, skipped } = resp

      const importStatus = (
        h('div', null, ...[
          h('div', null, ...[
            `Imported ${imported.length} out of ${imported.length + skipped.length} in file.`,
          ]),

          h(Box, { mt: 3 }, ...[
            h('h2', null, 'Imported'),

            imported.length === 0
              ? h('p', null, 'None')
              : h('ul', null, imported.map(([ name, canonicalName ]) =>
                  h('li', { key: name }, [
                    name,
                    name === canonicalName
                      ? ''
                      : ` (as ${canonicalName})`,
                  ]))),
          ]),

          h(Box, { mt: 3 }, ...[
            h('h2', null, 'Skipped'),

            skipped.length === 0
              ? h('p', null, 'None')
              : h('ul', null, skipped.map(name =>
                  h('li', { key: name }, name))),
          ]),

          h(Box, { mt: 3 }, ...[
            h(Button, {
              onClick: () => {
                setState(prev => ({
                  ...prev,
                  importStatus: null,
                }))
              },
            }, 'Dismiss'),
          ]),
        ])
      )

      setState(prev => ({
        ...prev,
        importStatus,
      }))
    } catch (e) {
      alert('Error while importing transcripts. See console for details.')
      console.error(e)
    }
  }

  const handleImport = (files: FileList | null) => {
    handleFiles(files)
  }

  if (importStatus) {
    return h(StatusContainer, {}, importStatus)
  }

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

              setState(prev => ({
                ...prev,
                showSearch: false,
              }))
            },
          }),

          h(Button, {
            onClick: () => {
              setState(prev =>({
                ...prev,
                showSearch: !showSearch,
              }))
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
          h(FileInput, {
            onChange: handleImport,
          }, 'Import'),

          h(Button, {
            disabled: savedTranscripts.size === 0,
            onClick() {
              dispatch(viewActions.exportSavedTranscripts({ view }))
            },
          }, 'Export'),
        ]),
      ]),
    ])
  )
}
