"use strict";

var React = require('react')
  , d3 = require('d3')

const dimensions = {
  PLOT_HEIGHT: 540,
  PLOT_WIDTH: 540,
  PLOT_PADDING: 48,
}

function PlotVisualization(container) {
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
    .attr('class', 'dots')
}

PlotVisualization.prototype = {
  update(cellA, cellB, plotData) {
    this.cellA = cellA;
    this.cellB = cellB;
    this.plotData = plotData;

    this.render();
  },

  getScales() {
    var cpmMin = Infinity
      , cpmMax = -Infinity
      , fcMin = Infinity
      , fcMax = -Infinity
      , x
      , y

    this.plotData.forEach(gene => {
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
    var [x, y] = this.getScales()
      , xAxis = d3.svg.axis().scale(x).orient('bottom')
      , yAxis = d3.svg.axis().scale(y).orient('left')
      , select

    this.g.select('.y-axis').call(yAxis);
    this.g.select('.x-axis').call(xAxis);

    this.g.select('.dots').selectAll('circle').remove();

    select = this.g.select('.dots').selectAll('circle').data(this.plotData);

    select.enter()
      .append('circle')
      .attr('cx', d => x(d.logCPM))
      .attr('cy', d => y(d.logFC))
      .attr('r', 1);
  }
}

module.exports = React.createClass({
  displayName: 'CellPlot',

  refresh() {
    this.state.visualization.update(this.props.cellA, this.props.cellB, this.props.plotData);
  },

  componentDidUpdate(prevProps) {
    var needsUpdate = (
      prevProps.cellA !== this.props.cellA ||
      prevProps.cellB !== this.props.cellB
    )

    if (needsUpdate) this.refresh();
  },

  componentDidMount() {
    this.setState({
      visualization: new PlotVisualization(React.findDOMNode(this))
    });
  },

  render() {
    return <div />
  }
});
