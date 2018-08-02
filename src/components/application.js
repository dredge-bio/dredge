"use strict"

/* eslint no-alert:0 */

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , SortedData = require('./sorted_data')


class Application extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props

    dispatch(Action.SetPairwiseComparison('sophie', 'EMS', 'C'))
  }

  render() {
    return h(SortedData)
  }
}
