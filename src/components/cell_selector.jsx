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
      <section className="flex" style={{ height: '10vh' }}>
        {
          embryos.map((embryoData, i) =>
            <div key={i} className="flex-auto px2">
              <a href="#"
                  className="inline-block center col-12 mb1"
                  style={{
                    backgroundColor: currentCell === embryoName(i) && 'red'
                  }}
                  onClick={this.handleClick.bind(null, embryoName(i))}>
                { embryoName(i) } embryo
              </a>
              <Embryo embryoData={embryoData} {...this.props} />
            </div>
          )
        }
      </section>
    )
  }
});
