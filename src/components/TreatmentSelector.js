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

function TreatmentSelector({ treatments, selectedTreatment, handleSelectTreatment, loading }) {
  const initialLoad = loading && !selectedTreatment

  const _treatments = Object.entries(treatments).map(([key, val]) => ({
    key,
    label: val.label || key,
  }))

  return (
    h(SelectorWrapper, [
      h('select', {
        value: selectedTreatment || '',
        disabled: initialLoad,
        onChange: e => {
          handleSelectTreatment(e.target.value)
        }
      }, (!selectedTreatment ? [h('option', {
        key: '_blank',
        value: '',
      }, 'Initializing...')] : []).concat(_treatments.map(treatment =>
        h('option', {
          key: treatment.key,
          value: treatment.key,
        }, treatment.label),
      ))),
    ])
  )
}

module.exports = connect(state => ({
  treatments: R.path(['currentView', 'project', 'treatments'], state),
  loading: R.path(['currentView', 'loading'], state),
}))(TreatmentSelector)
