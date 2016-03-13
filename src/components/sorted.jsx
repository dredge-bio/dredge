"use strict";

var React = require('react')

module.exports = function Sorted(Component) {
  return React.createClass({
    displayName: 'Sorted',

    getInitialState() {
      return {
        sortBy: 'geneName',
        sortOrder: 'desc'
      }
    },

    toggleSort(field) {
      var { sortBy, sortOrder } = this.state

      if (field === sortBy) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        sortBy = field;
        sortOrder = 'desc';
      }

      this.setState({ sortBy, sortOrder })
    },

    render() {
      return (
        <Component
            {...this.state}
            {...this.props}
            toggleSort={this.toggleSort} />
      )
    }
  });
}
