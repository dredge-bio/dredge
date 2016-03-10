"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , d3 = require('d3')


const dimensions = {
  PLOT_HEIGHT: 500,
  PLOT_WIDTH: 500,
  PADDING: 60
}

dimensions.SVG_HEIGHT = dimensions.PLOT_HEIGHT + (2 * dimensions.PADDING);
dimensions.SVG_WIDTH = dimensions.PLOT_WIDTH + (2 * dimensions.PADDING);

const GRID_SQUARE_UNIT = 8;

const GENE_BIN_MULTIPLIERS = {
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

  this.svg = d3.select(container);

  this.g = this.svg
    .append('g')
    .attr('transform', `translate(${dimensions.PADDING}, ${dimensions.PADDING})`)

  this.g.append('g')
    .attr('class', 'y-axis')

  this.g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${dimensions.PLOT_HEIGHT})`)

  this.svg.append('text')
    .attr('class', 'plot-title')
    .attr('transform', `translate(${dimensions.SVG_WIDTH - dimensions.PADDING}, 48)`)
    .attr('text-anchor', 'end')
    .style('font-weight', 'bold')
    .style('font-size', '24px')

  this.svg.append('text')
    .text('log FC')
    .style('font-weight', 'bold')
    .attr('y', dimensions.SVG_HEIGHT / 2)
    .attr('text-anchor', 'middle')
    .attr('transform', `
      rotate(-90, 0,${dimensions.SVG_HEIGHT / 2})
      translate(0 20)
    `)
    //.attr('transform', `rotate(-90) translate(-${dimensions.SVG_HEIGHT}, 20)`)

  this.svg.append('text')
    .text('log CPM')
    .style('font-weight', 'bold')
    .attr('x', dimensions.PLOT_WIDTH / 2)
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(${dimensions.PADDING}, ${dimensions.SVG_HEIGHT - 8})`)


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

    if (hoveredGene && plotData.has(hoveredGene)) {
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

    // TODO: These two scales' domains are hardcoded
    this.x = d3.scale.linear()
      .domain([0, 16])
      .range([0, dimensions.PLOT_WIDTH])

    this.y = d3.scale.linear()
      .domain([-20, 20])
      .range([dimensions.PLOT_HEIGHT, 0])

    this.bins = bin(this.data, this.x, this.y, GRID_SQUARE_UNIT)
    this.bins.forEach(geneBin => {
      geneBin.multiplier = GENE_BIN_MULTIPLIERS[geneBin.genes.length] || 1;
    })

    this.savedGenes = [savedGenes];
  },

  render() {
    var { x, y, bins, cellA, cellB, handleGeneDetailsChange } = this
      , xAxis = d3.svg.axis().scale(x).orient('bottom')
      , yAxis = d3.svg.axis().scale(y).orient('left')
      , container

    this.g.select('.y-axis').call(yAxis);
    this.g.select('.x-axis').call(xAxis);

    this.g.select('.squares').selectAll('rect').remove();
    this.g.select('.squares-overlay').selectAll('rect').remove();
    // this.g.select('.dots').selectAll('circle').remove();

    this.svg.select('.plot-title').text(`${cellA} - ${cellB}`);

    container = this.g.select('.squares-overlay')[0][0];

    this.g.select('.squares')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', dimensions.PLOT_WIDTH)
      .attr('height', dimensions.PLOT_HEIGHT)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')

    this.g.select('.squares').selectAll('rect').data(bins)
        .enter()
      .append('rect')
      .attr('x', d => d.x0 + ((1 - d.multiplier) / 2) * GRID_SQUARE_UNIT)
      .attr('y', d => d.y0 + ((1 - d.multiplier) / 2) * GRID_SQUARE_UNIT)
      .attr('width', d => GRID_SQUARE_UNIT * d.multiplier)
      .attr('height', d => GRID_SQUARE_UNIT * d.multiplier)
      .attr('fill', '#2566a8')

    this.g.select('.squares-overlay').selectAll('rect').data(bins)
        .enter()
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', GRID_SQUARE_UNIT)
      .attr('height', GRID_SQUARE_UNIT)
      .attr('fill', '#2566a8')
      .attr('fill', 'transparent')
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
      visualization: new PlotVisualization(this.refs.svg, handleGeneDetailsChange)
    });
  },

  render() {
    var { SVG_HEIGHT, SVG_WIDTH } = dimensions

    return (
      <svg
          ref="svg"
          style={{ width: 'auto', height: 'auto' }}
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} />
    )
  }
});
