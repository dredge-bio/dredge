import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'
import { Flex, Box, Button } from 'rebass'
import { unwrapResult } from '@reduxjs/toolkit'

import { useView, actions as viewActions } from '../view'
import { useAppDispatch } from '../hooks'
import { getSearchTranscripts } from '../projects'
import { readFile } from '../utils'

import FileInput from './util/FileInput'

const { useRef, useState, useEffect } = React

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

const SearchContainer = styled.div`
  z-index: 1;
  position: absolute;

  top: calc(100% + 8px);
  left: -20px;
  right: 25%;
  height: 400px;

  border: 1px solid black;
  border-radius: 6px;
  background: #fafafa;
  box-shadow: 2px 0px 10px #aaa;

  padding: 1rem;

  display: flex;
  flex-direction: column;

  & input {
    padding: 6px;
  }

  & > :nth-child(2) {
    flex: 1;
    overflow-y: scroll;
    margin-top: 1rem;
  }

  & ul {
    padding: 0;
    list-style-type: none;
  }

  & li a {
    color: blue;
    display: inline-block;
    text-decoration: none;
    padding: 4px 8px;
  }

  & li a:hover {
    background: #eee;
  }
`

type SearchState = {
  searchText: string,
  searchResults: null | {
    alias: string,
    canonical: string,
  }[]
}

type SearchProps = {
  onSelect: (transcriptID: string) => void;
}

// FIXME: make this work for any loaded project
function Search(props: SearchProps) {
  const { project } = useView('Bulk')
      , searchTranscripts = getSearchTranscripts(project)
      , ref = useRef<HTMLInputElement>()
      , { onSelect } = props

  const [{
    searchText,
    searchResults,
  }, setState] = useState<SearchState>({
    searchText: '',
    searchResults: null,
  })

  useEffect(() => {
    setState(prev => ({
      ...prev,
      searchResults: searchText.length > 1
        ? searchTranscripts(searchText, 10)
        : null,
    }))
  }, [searchText])

  useEffect(() => {
    if (ref.current) {
      ref.current.focus()
    }
  }, [ref.current])

  const handleChange = (e: Event) => {
    const inputEl = e.target as HTMLInputElement

    setState(prev => ({
      ...prev,
      searchText: inputEl.value,
    }))
  }

  return (
    h(SearchContainer, [
      h('input', {
        ref,
        value: searchText,
        placeholder: 'Search for transcript',
        onChange: handleChange,
      }),

      h('ul', {}, searchResults && (
        searchResults.length === 0
          ? h('i', 'No results')
          : searchResults.map(({ alias, canonical }) =>
              h('li', {
                key: alias,
              }, [
                h('a', {
                  href: '#',
                  onClick: (e: Event) => {
                    e.preventDefault()
                    onSelect(canonical)
                  },
                }, alias),

                h('span', ` (${canonical})`),
              ])
            )
      )),
    ])
  )
}

type WatchedTranscriptsState = {
  showSearch: boolean;
  importStatus: React.ReactElement | null;
}


// FIXME: Make this generic across any view
export default function WatchedTranscripts() {
  const view = useView('Bulk')
      , dispatch = useAppDispatch()

  const {
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
        h('div', [
          h('div', [
            `Imported ${imported.length} out of ${imported.length + skipped.length} in file.`,
          ]),

          h(Box, { mt: 3 }, [
            h('h2', 'Imported'),

            imported.length === 0
              ? h('p', 'None')
              : h('ul', imported.map(([ name, canonicalName ]) =>
                  h('li', { key: name }, [
                    name,
                    name === canonicalName
                      ? ''
                      : ` (as ${canonicalName})`,
                  ]))),
          ]),

          h(Box, { mt: 3 }, [
            h('h2', 'Skipped'),

            skipped.length === 0
              ? h('p', 'None')
              : h('ul', skipped.map(name =>
                  h('li', { key: name }, name))),
          ]),

          h(Box, { mt: 3 }, [
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
    }, [
      h('h2', {
        style: {
          fontSize: 16,
          marginBottom: '.25em',
        },
      }, 'Watched transcripts'),
      h(Flex, {
        justifyContent: 'space-between',
      }, [
        h(ButtonContainer, [
          !showSearch ? null : h(Search, {
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

        h(ButtonContainer, [
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
