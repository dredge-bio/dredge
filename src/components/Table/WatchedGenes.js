"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
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

function WatchedGenes({
  dispatch,
  savedGenes,
  brushedGenes,
}) {
  return (
    h('div', {
      style: {
        margin: '.75em 0 1em',
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
          h(Button, 'Search'),
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

module.exports = connect(state => ({
  savedGenes: R.path(['currentView', 'savedGenes'], state),
  brushedGenes: R.path(['currentView', 'brushedGenes'], state),
}))(WatchedGenes)
