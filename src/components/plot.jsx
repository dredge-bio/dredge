"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , d3 = require('d3')


const dimensions = {
  PLOT_HEIGHT: 540,
  PLOT_WIDTH: 540,
  PLOT_PADDING: 48,
}


function PlotVisualization(container, handleGeneDetailsChange) {
  this.handleGeneDetailsChange = handleGeneDetailsChange;

  this.svg = d3.select(container)
    .append('svg')
    .attr('width', dimensions.PLOT_WIDTH)
    .attr('height', dimensions.PLOT_HEIGHT)

  this.g = this.svg
    .append('g')
    .attr('transform', `translate(${dimensions.PLOT_PADDING}, ${dimensions.PLOT_PADDING})`)

  this.g.append('g')
    .attr('class', 'y-axis')

  this.g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${dimensions.PLOT_HEIGHT - 2 * dimensions.PLOT_PADDING})`)

  this.g.append('g')
    .attr('class', 'squares')

  this.g.append('g')
    .attr('class', 'dots')
}

PlotVisualization.prototype = {
  update(cellA, cellB, data) {
    this.cellA = cellA;
    this.cellB = cellB;
    this.data = data;

    this.render();
  },

  getScales() {
    var cpmMin = Infinity
      , cpmMax = -Infinity
      , fcMin = Infinity
      , fcMax = -Infinity
      , x
      , y

    this.data.forEach(gene => {
      if (gene.logCPM < cpmMin) cpmMin = gene.logCPM;
      if (gene.logCPM > cpmMax) cpmMax = gene.logCPM;

      if (gene.logFC < fcMin) fcMin = gene.logFC;
      if (gene.logFC > fcMax) fcMax = gene.logFC;
    });

    x = d3.scale.linear()
      .domain([cpmMin, cpmMax])
      .range([0, dimensions.PLOT_WIDTH - (2 * dimensions.PLOT_PADDING)])

    y = d3.scale.linear()
      .domain([fcMin, fcMax])
      .range([dimensions.PLOT_HEIGHT - (2 * dimensions.PLOT_PADDING), 0])

    return [x, y];
  },

  render() {
    var bin = require('../utils/bin')
      , units = 75
      , rectWidth = (dimensions.PLOT_WIDTH - 2 * dimensions.PLOT_PADDING) / units
      , [x, y] = this.getScales()
      , xAxis = d3.svg.axis().scale(x).orient('bottom')
      , yAxis = d3.svg.axis().scale(y).orient('left')
      , { handleGeneDetailsChange } = this
      , bins
      , colorScale
      , container

    this.g.select('.y-axis').call(yAxis);
    this.g.select('.x-axis').call(xAxis);

    this.g.select('.squares').selectAll('rect').remove();
    this.g.select('.dots').selectAll('circle').remove();

    bins = bin(this.data, x, y, units);

    colorScale = d3.scale.log()
      .domain(d3.extent(bins, d => d.genes.length))
      .range(["#deebf7", "#08519c", '#000'])

    container = this.g.select('.squares')[0][0];

    this.g.select('.squares').selectAll('rect').data(bins)
        .enter()
      .append('rect')
      .attr('x', d => x(d.cpmMin))
      .attr('y', d => y(d.fcMax))
      .attr('width', rectWidth)
      .attr('height', rectWidth)
      .attr('fill', d => colorScale(d.genes.length))
      .on('mouseover', function () {
        container.appendChild(this);
      })
      .on('click', function (d) {
        handleGeneDetailsChange(d.genes);
      })
      .append('title').text(d => d.genes.length)

      /*
    this.g.select('.dots').selectAll('circle').data(this.data)
        .enter()
      .append('circle')
      .attr('cx', d => x(d.logCPM))
      .attr('cy', d => y(d.logFC))
      .attr('r', 1)
      */
  },
}

module.exports = React.createClass({
  displayName: 'CellPlot',

  propTypes: {
    cellA: React.PropTypes.string,
    cellB: React.PropTypes.string,
    data: React.PropTypes.instanceOf(Immutable.Map)
  },

  refresh() {
    this.state.visualization.update(
      this.props.cellA,
      this.props.cellB,
      this.props.data.toArray()
    );
  },

  componentDidUpdate(prevProps) {
    var { cellA, cellB, pValueLower, pValueUpper, data } = this.props
      , needsUpdate = data && !prevProps.data

    needsUpdate = needsUpdate || (
      data &&
      prevProps.cellA !== cellA ||
      prevProps.cellB !== cellB ||
      prevProps.pValueLower !== pValueLower ||
      prevProps.pValueUpper !== pValueUpper
    )

    if (needsUpdate) {
      this.refresh();
    }
  },

  componentDidMount() {
    var { handleGeneDetailsChange } = this.props

    this.setState({
      visualization: new PlotVisualization(React.findDOMNode(this), handleGeneDetailsChange)
    });
  },

  render() {
    return <div />
  }
});
