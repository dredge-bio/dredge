"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')

const SelectorWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;

  & select {
    padding: 1em;
  }
`

function CellSelector({ samples, selectedSample, handleSelectSample, loading }) {
  const initialLoad = loading && !selectedSample

  const _samples = Object.entries(samples).map(([key, val]) => ({
    key,
    label: val.label || key,
  }))

  return (
    h(SelectorWrapper, [
      h('select', {
        value: selectedSample || '',
        disabled: initialLoad,
        onChange: e => {
          handleSelectSample(e.target.value)
        }
      }, (!selectedSample ? [h('option', {
        key: '_blank',
        value: '',
      }, 'Initializing...')] : []).concat(_samples.map(sample =>
        h('option', {
          key: sample.key,
          value: sample.key,
        }, sample.label),
      ))),
    ])
  )
}

module.exports = connect(state => ({
  samples: R.path(['currentView', 'project', 'samples'], state),
  loading: R.path(['currentView', 'loading'], state),
}))(CellSelector)
