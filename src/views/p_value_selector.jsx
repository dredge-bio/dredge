"use strict";

var React = require('react')
  , d3 = require('d3')

const dimensions = {
  PVALUE_HEIGHT: 100,
  PVALUE_WIDTH: 200,
  PVALUE_PADDING: 12,
}


function PValueVisualization(container) {
  this.svg = d3.select(container)
    .append('svg')
    .attr('width', dimensions.PVALUE_WIDTH)
    .attr('height', dimensions.PVALUE_HEIGHT)

  this.g = this.svg
    .append('g')
    .attr('transform', `translate(${dimensions.PVALUE_PADDING}, ${dimensions.PVALUE_PADDING})`)

}

PValueVisualization.prototype = {
  update(plotData) {
    this.plotData = plotData;

    this.render();
  },

  render() {
    var pValues = this.plotData.map(gene => gene.pValue)
      , x
      , y
      , data

    x = d3.scale.linear()
      .domain([0, 1])
      .range([0, dimensions.PVALUE_WIDTH - dimensions.PVALUE_PADDING])

    data = d3.layout.histogram()
      .bins(x.ticks(100))(pValues)

    y = d3.scale.linear()
      .domain([0, d3.max(data, d => d.y)])
      .range([dimensions.PVALUE_HEIGHT - dimensions.PVALUE_PADDING, 0])

    this.g.selectAll('rect').remove();

    this.g.selectAll('rect')
        .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.x))
      .attr('width', d => x(d.dx))
      .attr('y', d => dimensions.PVALUE_HEIGHT - dimensions.PVALUE_PADDING - y(d.y))
      .attr('height', d => y(d.y))

  }
}


module.exports = React.createClass({
  displayName: 'PValueSelector',

  propTypes: {
    onPValueChange: React.PropTypes.func.isRequired,
    plotData: React.PropTypes.object
  },

  componentDidUpdate(prevProps) {
    var stringify = require('json-stable-stringify')

    if (stringify(prevProps.plotData) !== stringify(this.props.plotData)) {
      this.state.visualization.update(this.props.plotData);
    }
  },

  componentDidMount() {
    this.setState({
      visualization: new PValueVisualization(React.findDOMNode(this))
    });
  },


  render: function () {
    return <div />
  }
});
