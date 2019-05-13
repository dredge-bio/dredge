"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { Flex, Box, Button } = require('rebass')
    , { connect } = require('react-redux')
    , Action = require('../actions')
    , { projectForView } = require('../utils')

function union(a, b) {
  return new Set([...a, ...b])
}

function difference(a, b) {
  const c = new Set()

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
            : searchResults.map(({ alias, canonical }) =>
                h('li', {
                  key: alias,
                }, [
                  h('a', {
                    href: '#',
                    onClick: e => {
                      e.preventDefault()
                      onSelect(canonical)
                    },
                  }, alias),

                  h('span', ` (${canonical})`),

                ]),
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
      importStatus: null,
    }

    this.handleImport = this.handleImport.bind(this)
  }

  handleImport() {
    const { dispatch } = this.props
        , inputEl = document.createElement('input')

    inputEl.type = 'file'
    inputEl.onchange = async () => {
      const { files } = inputEl

      if (files.length) {
        try {
          const resp = await dispatch(Action.ImportSavedTranscripts(files[0]))
              , { imported, skipped } = resp.readyState.response

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
                    this.setState({ importStatus: null })
                  },
                }, 'Dismiss'),
              ]),
            ])
          )

          this.setState({ importStatus })

        } catch (e) {
          alert('Error while importing transcripts. See console for details.')
          console.error(e)
        }
      }
    }

    inputEl.click()
  }

  render() {
    const { dispatch, displayedTranscripts, savedTranscripts, brushedArea, project } = this.props
        , { showSearch, importStatus } = this.state

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
              disabled: brushedArea == null || displayedTranscripts.length === 0,
              onClick() {
                const names = displayedTranscripts.map(R.path(['transcript', 'name']))

                dispatch(Action.SetSavedTranscripts(
                  union(savedTranscripts, new Set(names))
                ))
              },
            }, 'Watch selected'),

            h(Button, {
              disabled: brushedArea == null || displayedTranscripts.length === 0,
              onClick() {
                const names = displayedTranscripts.map(R.path(['transcript', 'name']))

                dispatch(Action.SetSavedTranscripts(
                  difference(savedTranscripts, new Set(names))
                ))
              },
            }, 'Unwatch selected'),
            h(Button, {
              disabled: savedTranscripts.size === 0,
              onClick() {
                dispatch(Action.SetSavedTranscripts(new Set()))
              },
            }, 'Clear'),
          ]),
          h(ButtonContainer, [
            h(Button, {
              onClick: this.handleImport,
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

module.exports = connect(state => {
  const project = projectForView(state) || {}

  return Object.assign({
    project,
  }, R.pick(['brushedArea', 'savedTranscripts', 'displayedTranscripts' ], state.view))
})(WatchedTranscripts)
