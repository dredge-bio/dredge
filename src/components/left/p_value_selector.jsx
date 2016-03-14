"use strict";

var React = require('react')
  , ReactDOM = require('react-dom')
  , Immutable = require('immutable')
  , d3 = require('d3')

const dimensions = {
  PVALUE_HEIGHT: 540,
  PVALUE_WIDTH: 100,
  PVALUE_PADDING_LEFT: 32,
  PVALUE_PADDING_RIGHT: 24,
  PVALUE_PADDING_TOP: 24,
  PVALUE_PADDING_BOTTOM: 60
}


function PValueVisualization(container) {
  this.svg = d3.select(container)
    .append('svg')
    .attr('width', dimensions.PVALUE_WIDTH)
    .attr('height', dimensions.PVALUE_HEIGHT)

  this.g = this.svg
    .append('g')
    .attr('transform', `translate(
      ${dimensions.PVALUE_PADDING_LEFT},
      ${dimensions.PVALUE_PADDING_TOP}
    )`)

  this.g.append('g')
    .attr('class', 'graph')

  this.g.append('g')
    .attr('class', 'brush')

  this.g.append('g')
    .attr('class', 'y-axis')

  this.g.append('g')
    .attr('class', 'x-axis')

  this.y = d3.scale.linear()
    .domain([1, 0])
    .range([0, dimensions.PVALUE_HEIGHT - dimensions.PVALUE_PADDING_BOTTOM])

  this.brush = d3.svg.brush()
    .y(this.y)
    .on('brushend', () => {
      var [start, stop] = this.brush.extent()

      if (start === stop) {
        start = 0;
        stop = 1;
      }

      this.onPValueChange(start, stop);
    })
}

PValueVisualization.prototype = {
  update(data) {
    this.data = data;

    this.render();
  },

  render() {
    var pValues = this.data.map(gene => gene.pValue)
      , datapoints = []
      , x
      , data
      , areaFn
      , yAxis
      , max

    data = d3.layout.histogram()
      .bins(this.y.ticks(100))(pValues)

    data.forEach(point => {
      datapoints.push({ x: point.x, y: point.y });
      datapoints.push({ x: point.x + point.dx, y: point.y });
    });

    max = d3.max(data, d => d.y)

    x = d3.scale.linear()
      .domain([0, max])
      .range([0, dimensions.PVALUE_WIDTH - dimensions.PVALUE_PADDING_LEFT - dimensions.PVALUE_PADDING_RIGHT])
      .nice()

    areaFn = d3.svg.area()
      .x(d => x(d.y))
      .x0(() => x(0))
      .y(d => this.y(d.x))
      .interpolate('linear')

    this.g.select('.brush').select('g').remove();
    this.g.select('.brush')
      .append('g')
      .call(this.brush)
      .selectAll('rect')
        .attr('x', 0)
        .attr('width', x(max))


    this.g.select('.graph').select('path').remove();

    this.g.select('.graph').append('path')
      .datum(datapoints)
      .attr('d', areaFn)
      .attr('class', 'pvalues')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1)
      .attr('fill', 'black')

    yAxis = d3.svg.axis().scale(this.y).ticks(4).orient('left');
    this.g.select('.y-axis').call(yAxis);

    /*
    xAxis = d3.svg.axis()
      .scale(x)
      .tickValues([0, max])
      .orient('top');
    this.g.select('.x-axis').call(xAxis);
    */

  }
}


module.exports = React.createClass({
  displayName: 'PValueSelector',

  propTypes: {
    onPValueChange: React.PropTypes.func.isRequired,
    data: React.PropTypes.instanceOf(Immutable.Map)
  },

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.state.visualization.update(this.props.data.toArray());
    }
  },

  componentDidMount() {
    var el = ReactDOM.findDOMNode(this)
      , initialSelection
      , visualization

    if (!(this.props.pValueLower === 1 && this.props.pValueLower === 0)) {
      initialSelection = [this.props.pValueLower, this.props.pValueUpper];
    }

    visualization = new PValueVisualization(el, initialSelection)

    visualization.onPValueChange = this.props.onPValueChange;

    this.setState({ visualization });
  },


  render: function () {
    return <div />
  }
});
