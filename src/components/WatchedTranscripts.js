"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Action = require('../actions')

function union(a, b) {
  const c = new Set()

  a.forEach(x => c.add(x))
  b.forEach(x => c.add(x))

  return c
}

function difference(a, b) {
  const c = new Set()

  a.forEach(x => {
    if (!b.has(x)) c.add(x)
  })

  return c
}

const Button = styled.button`
  border: 1px solid #666;
  border-radius: 3px;
  background-color: white;
  padding: 6px 12px;

  font-weight: bold;
  font-size: 14px;

  cursor: pointer;

  &:not(:last-of-type) {
    margin-right: 8px;
  }

  &:hover:not(:disabled) {
    background-color: #f0f0f0;
  }

  &:disabled {
    opacity: .75;
    cursor: not-allowed;
  }
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
    display: block;
    text-decoration: none;
    padding: 4px 8px;
  }

  & li a:hover {
    background: #eee;
  }
`

class Search extends React.Component {
  constructor() {
    super();

    this.state = {
      searchText: '',
      searchResults: null,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { project } = this.props
        , { searchText } = this.state
        , prevSearchText = prevState.searchText

    if (searchText !== prevSearchText) {
      this.setState({
        searchResults: searchText.length > 1
          ? project.searchTranscripts(searchText)
          : null,
      })
    }
  }

  componentDidMount() {
    this.searchEl.focus()
  }

  render() {
    const { onSelect } = this.props
        , { searchText, searchResults } = this.state

    return (
      h(SearchContainer, [
        h('input', {
          ref: el => { this.searchEl = el },
          value: searchText,
          placeholder: 'Search for transcript',
          onChange: e => {
            this.setState({ searchText: e.target.value })
          },
        }),

        h('ul', {}, searchResults && (
          searchResults.length === 0
            ? h('i', 'No results')
            : searchResults.map(({ _key_, value }) =>
                h('li', {
                  key: _key_,
                }, h('a', {
                  href: '#',
                  onClick: e => {
                    e.preventDefault()
                    onSelect(value)
                  },
                }, _key_)),
              )
        )),
      ])
    )
  }
}

class WatchedTranscripts extends React.Component {
  constructor() {
    super()

    this.state = {
      showSearch: false,
    }
  }

  render() {
    const { dispatch, savedTranscripts, brushedTranscripts, project } = this.props
        , { showSearch } = this.state

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
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
          },
        }, [
          h('div', [
            !showSearch ? null : h(Search, {
              project,
              onSelect: (transcriptName) => {
                const newSavedTranscripts = new Set(savedTranscripts)
                newSavedTranscripts.add(transcriptName)

                dispatch(Action.SetSavedTranscripts(newSavedTranscripts))

                this.setState({ showSearch: false })
              },
            }),

            h(Button, {
              onClick: () => {
                this.setState({
                  showSearch: !showSearch,
                })
              },
            }, 'Search'),

            h(Button, {
              disabled: brushedTranscripts.size === 0,
              onClick() {
                dispatch(Action.SetSavedTranscripts(
                  union(savedTranscripts, brushedTranscripts)
                ))
              },
            }, 'Watch selected'),

            h(Button, {
              disabled: brushedTranscripts.size === 0,
              onClick() {
                dispatch(Action.SetSavedTranscripts(
                  difference(savedTranscripts, brushedTranscripts)
                ))
              },
            }, 'Unwatch selected'),
            h(Button, {
              disabled: savedTranscripts.size === 0,
              onClick() {
                dispatch(Action.SetSavedTranscripts(new Set()))
              },
            }, 'Unwatch all'),
          ]),
          h('div', [
            h(Button, {
              onClick() {
                const inputEl = document.createElement('input')
                inputEl.type = 'file'
                inputEl.onchange = () => {
                  const { files } = inputEl

                  if (files.length) {
                    dispatch(Action.ImportSavedTranscripts(files[0]))
                  }
                }

                inputEl.click()
              },
            }, 'Import'),

            h(Button, {
              disabled: savedTranscripts.size === 0,
              onClick() {
                dispatch(Action.ExportSavedTranscripts)
              },
            }, 'Export'),
          ]),
        ]),
      ])
    )
  }
}

module.exports = connect(state => ({
  project: R.path(['currentView', 'project'], state),
  savedTranscripts: R.path(['currentView', 'savedTranscripts'], state),
  brushedTranscripts: R.path(['currentView', 'brushedTranscripts'], state),
}))(WatchedTranscripts)
