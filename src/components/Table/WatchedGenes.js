"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Action = require('../../actions')

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
          ? project.searchGenes(searchText)
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
          placeholder: 'Search for gene',
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

class WatchedGenes extends React.Component {
  constructor() {
    super()

    this.state = {
      showSearch: false,
    }
  }

  render() {
    const { dispatch, savedGenes, brushedGenes, project } = this.props
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
        }, 'Watched genes'),
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
          },
        }, [
          h('div', [
            !showSearch ? null : h(Search, {
              project,
              onSelect: (geneName) => {
                const newSavedGenes = new Set(savedGenes)
                newSavedGenes.add(geneName)

                dispatch(Action.SetSavedGenes(newSavedGenes))

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
              disabled: brushedGenes.size === 0,
              onClick() {
                dispatch(Action.SetSavedGenes(
                  union(savedGenes, brushedGenes)
                ))
              },
            }, 'Watch selected'),

            h(Button, {
              disabled: brushedGenes.size === 0,
              onClick() {
                dispatch(Action.SetSavedGenes(
                  difference(savedGenes, brushedGenes)
                ))
              },
            }, 'Unwatch selected'),
            h(Button, {
              disabled: savedGenes.size === 0,
              onClick() {
                dispatch(Action.SetSavedGenes(new Set()))
              },
            }, 'Unwatch all'),
          ]),
          h('div', [
            h(Button, 'Import'),
            h(Button, {
              disabled: savedGenes.size === 0,
            }, 'Export'),
          ]),
        ]),
      ])
    )
  }
}

module.exports = connect(state => ({
  project: R.path(['currentView', 'project'], state),
  savedGenes: R.path(['currentView', 'savedGenes'], state),
  brushedGenes: R.path(['currentView', 'brushedGenes'], state),
}))(WatchedGenes)
