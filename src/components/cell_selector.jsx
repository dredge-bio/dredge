"use strict";

var React = require('react')
  , embryos = require('../embryos.json')

function embryoName(i) {
  return `${Math.pow(2, i)}-cell`
}

module.exports = React.createClass({
  displayName: 'CellSelector',

  propTypes: {
    currentCell: React.PropTypes.string,
    onSelectCell: React.PropTypes.func.isRequired
  },

  handleClick: function (cellName, e) {
    e.preventDefault();
    this.props.onSelectCell(cellName);
  },

  render: function () {
    var Embryo = require('./embryo.jsx')
      , { currentCell } = this.props

    return (
      <div className="flex" style={{ height: '100%' }}>
        {
          embryos.map((embryoData, i) =>
            <div key={i} className="flex flex-column flex-auto px1 py1">
              <a href="#"
                  className="center col-12 flex-grow"
                  style={{
                    backgroundColor: currentCell === embryoName(i) && 'red',
                      width: '100%',
            overflowX: 'hidden',
            overflowY: 'normal',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
                  }}
                  onClick={this.handleClick.bind(null, embryoName(i))}>
                { embryoName(i) } embryo
              </a>
              <Embryo embryoData={embryoData} {...this.props} />
            </div>
          )
        }
      </div>
    )
  }
});
