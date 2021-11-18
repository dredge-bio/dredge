import { createElement as h } from 'react'
import styled from 'styled-components'
import * as React from 'react'
import { useTranscripts } from '../hooks'
import { LoadedProject } from '@dredge/main'

const { useRef, useState, useEffect } = React

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
  project: LoadedProject;
}

// FIXME: make this work for any loaded project
export function SearchTranscripts(props: SearchProps) {
  const { onSelect, project } = props
      , { searchTranscripts } = useTranscripts(project)
      , ref = useRef<HTMLInputElement>()

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
      searchResults: searchText.length > 0
        ? searchTranscripts(searchText, 25)
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
    h(SearchContainer, null, ...[
      h('input', {
        ref,
        value: searchText,
        placeholder: 'Search for transcript',
        onChange: handleChange,
      }),

      h('ul', null, searchResults && (
        searchResults.length === 0
          ? h('i', null, 'No results')
          : searchResults.map(({ alias, canonical }) =>
              h('li', {
                key: alias,
              }, ...[
                h('a', {
                  href: '#',
                  style: {
                    display: 'inline-block',
                    width: '100%',
                  },
                  onClick: (e: Event) => {
                    e.preventDefault()
                    onSelect(canonical)
                  },
                }, alias),

                alias === canonical ? null : h('span', null, ` (${canonical})`),
              ])
            )
      )),
    ])
  )
}
