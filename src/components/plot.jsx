"use strict";

var React = require('react')
  , ReactDOM = require('react-dom')
  , Immutable = require('immutable')
  , d3 = require('d3')


const dimensions = {
  PLOT_HEIGHT: 540,
  PLOT_WIDTH: 540,
  PLOT_PADDING: 48,
}

const GRID_UNITS = 75;

const GENE_BIN_MULTIPLIERs = {
  1: .4,
  2: .6,
  3: .8
}


/*
 * 1. Colors all same darkness
 * 2. Number of genes in the cell determines size of fill
 * 3. Different colors for different saved genes
 */


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

  /*
  this.g.append('g')
    .attr('class', 'dots')
  */

  this.g.append('g')
    .attr('class', 'hoverdot')

  this.g.append('g')
    .attr('class', 'squares-overlay')
}

PlotVisualization.prototype = {
  update({
    cellA,
    cellB,
    data,
    savedGenes,
    hoveredGene
  }) {

    this.cellA = cellA;
    this.cellB = cellB;

    this.plotData = data;
    this.data = data.toArray();

    this.savedGenes = savedGenes.toJS();

    this.updateScalesAndSavedGenes();
    this.render();
    this.updateHoveredGene({ hoveredGene });
  },

  updateHoveredGene({ hoveredGene }) {
    var { x, y, plotData } = this

    this.g.select('.hoverdot')
      .selectAll('circle')
      .transition()
        .duration(150)
        .style('opacity', 0)
        .remove()

    if (hoveredGene) {
      this.g.select('.hoverdot').datum(plotData.get(hoveredGene))
        .append('circle')
        .attr('cx', d => x(d.logCPM))
        .attr('cy', d => y(d.logFC))
        .attr('fill', 'rgba(255, 0, 0, 1)')
        .attr('r', 3)
    }
  },

  updateScalesAndSavedGenes() {
    var bin = require('../utils/bin')
      , cpmMin = Infinity
      , cpmMax = -Infinity
      , fcMin = Infinity
      , fcMax = -Infinity
      , savedGenes = []

    this.data.forEach(gene => {
      if (this.savedGenes.indexOf(gene.geneName) !== -1) savedGenes.push(gene);

      if (gene.logCPM < cpmMin) cpmMin = gene.logCPM;
      if (gene.logCPM > cpmMax) cpmMax = gene.logCPM;

      if (gene.logFC < fcMin) fcMin = gene.logFC;
      if (gene.logFC > fcMax) fcMax = gene.logFC;
    });


    // Update object's state
    this.x = d3.scale.linear()
      .domain([cpmMin, cpmMax])
      .range([0, dimensions.PLOT_WIDTH - (2 * dimensions.PLOT_PADDING)])

    this.y = d3.scale.linear()
      .domain([fcMin, fcMax])
      .range([dimensions.PLOT_HEIGHT - (2 * dimensions.PLOT_PADDING), 0])

    this.bins = bin(this.data, this.x, this.y, GRID_UNITS)
    this.bins.forEach(geneBin => {
      geneBin.multiplier = GENE_BIN_MULTIPLIERs[geneBin.genes.length] || 1;
    })

    this.savedGenes = [savedGenes];
  },

  render() {
    var { x, y, bins, handleGeneDetailsChange } = this
      , { PLOT_WIDTH, PLOT_PADDING } = dimensions
      , rectWidth = (PLOT_WIDTH - 2 * PLOT_PADDING) / GRID_UNITS
      , xAxis = d3.svg.axis().scale(x).orient('bottom')
      , yAxis = d3.svg.axis().scale(y).orient('left')
      , colorScale
      , container

    this.g.select('.y-axis').call(yAxis);
    this.g.select('.x-axis').call(xAxis);

    this.g.select('.squares').selectAll('rect').remove();
    this.g.select('.squares-overlay').selectAll('rect').remove();
    // this.g.select('.dots').selectAll('circle').remove();

    colorScale = d3.scale.log()
      .domain(d3.extent(bins, d => d.genes.length))
      .range(["#deebf7", "#08519c", '#000'])

    container = this.g.select('.squares-overlay')[0][0];

    this.g.select('.squares').selectAll('rect').data(bins)
        .enter()
      .append('rect')
      .attr('x', d => x(d.cpmMin) + ((1 - d.multiplier) / 2) * rectWidth)
      .attr('y', d => y(d.fcMax) + ((1 - d.multiplier) / 2) * rectWidth)
      .attr('width', d => rectWidth * d.multiplier)
      .attr('height', d => rectWidth * d.multiplier)
      .attr('fill', d => colorScale(50))

    squares = this.g.select('.squares-overlay').selectAll('rect').data(bins)
        .enter()
      .append('rect')
      .attr('x', d => x(d.cpmMin))
      .attr('y', d => y(d.fcMax))
      .attr('width', rectWidth)
      .attr('height', rectWidth)
      .attr('fill', 'rgba(255,255,255,0)')
      .on('mouseover', function () {
        container.appendChild(this);
      })
      .on('click', function (d) {
        handleGeneDetailsChange(d.genes);
      })
      .append('title').text(d => d.genes.length)

    /* These were for saved genes, but not really doing that anymore
    this.g.select('.dots').selectAll('circle').data(savedGenes)
        .enter()
      .append('circle')
      .attr('cx', d => x(d.logCPM))
      .attr('cy', d => y(d.logFC))
      .attr('r', 2)
    */
  },
}

module.exports = React.createClass({
  displayName: 'CellPlot',

  propTypes: {
    cellA: React.PropTypes.string,
    cellB: React.PropTypes.string,
    data: React.PropTypes.instanceOf(Immutable.Map),
    savedGenes: React.PropTypes.instanceOf(Immutable.Set),
  },

  componentDidUpdate(prevProps) {
    var { cellA, cellB, pValueLower, pValueUpper, data, hoveredGene } = this.props
      , { visualization } = this.state
      , needsUpdate

    needsUpdate = data && !prevProps.data || (
      data &&
      prevProps.cellA !== cellA ||
      prevProps.cellB !== cellB ||
      prevProps.pValueLower !== pValueLower ||
      prevProps.pValueUpper !== pValueUpper
    )

    if (needsUpdate) {
      visualization.update(this.props);
    } else if (prevProps.hoveredGene !== hoveredGene) {
      visualization.updateHoveredGene(this.props);
    }
  },

  componentDidMount() {
    var { handleGeneDetailsChange } = this.props

    this.setState({
      visualization: new PlotVisualization(ReactDOM.findDOMNode(this), handleGeneDetailsChange)
    });
  },

  render() {
    return <div />
  }
});
