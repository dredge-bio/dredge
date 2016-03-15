"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , d3 = require('d3')
  , formatCellName = require('../../utils/format_cell_name')


const SVG_PADDING = 60

function getDimensions(SVG_WIDTH, SVG_HEIGHT) {
  return {
    SVG_WIDTH,
    SVG_HEIGHT,
    PADDING: SVG_PADDING,
    PLOT_WIDTH: SVG_WIDTH - 2 * SVG_PADDING,
    PLOT_HEIGHT: SVG_HEIGHT - 2 * SVG_PADDING
  }
}

const GRID_SQUARE_UNIT = 8;

const GENE_BIN_MULTIPLIERS = {
  1: .4,
  2: .6,
  3: .8
}

function withinBounds([min, max], value) {
  return value >= min && value <= max;
}


/*
 * 1. Colors all same darkness
 * 2. Number of genes in the cell determines size of fill
 * 3. Different colors for different saved genes
 */


function PlotVisualization(container, dimensions, setBrushedGenes) {
  var that = this;

  this.setBrushedGenes = setBrushedGenes;
  this.dimensions = dimensions;

  this.svg = d3.select(container);

  this.g = this.svg
    .append('g')
    .attr('transform', `translate(${dimensions.PADDING}, ${dimensions.PADDING})`)

  // Scales and axes
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

  this.x = d3.scale.linear()
    .domain([0, 16])
    .range([0, dimensions.PLOT_WIDTH])

  this.y = d3.scale.linear()
    .domain([-20, 20])
    .range([dimensions.PLOT_HEIGHT, 0])

  var xAxis = d3.svg.axis().scale(this.x).orient('bottom')
    , yAxis = d3.svg.axis().scale(this.y).orient('left')

  this.g.select('.y-axis').call(yAxis);
  this.g.select('.x-axis').call(xAxis);


  this.g.append('g')
    .attr('class', 'dots')

  this.g.append('g')
    .attr('class', 'hoverdot')

  this.g.append('g')
    .attr('class', 'brush')
    .call(
      d3.svg.brush()
        .x(this.x)
        .y(this.y)
        .on('brushend', function () {
          var extent = d3.event.target.extent()
            , cpmBounds = [extent[0][0], extent[1][0]]
            , fcBounds = [extent[0][1], extent[1][1]]
            , brushedBins

          that.binSelection.attr('fill', '#2566a8');

          brushedBins = that.binSelection.filter(d => {
            var { cpmMin, cpmMax, fcMin, fcMax } = d

            return (
                (withinBounds(cpmBounds, cpmMin) || withinBounds(cpmBounds, cpmMax)) &&
                (withinBounds(fcBounds, fcMin) || withinBounds(fcBounds, fcMax))
            )
          });

          brushedBins.attr('fill', 'purple');

          setBrushedGenes(Immutable.OrderedSet(
            Array.prototype.concat.apply([],
              brushedBins.data().map(bin => bin.genes.map(gene => gene.geneName)))))
        })
    )

  this.g.append('g')
    .attr('class', 'squares-overlay')

}

PlotVisualization.prototype = {
  update({
    cellA,
    cellB,
    pairwiseComparisonData,
    pValueThreshhold,
    savedGeneNames,
    hoveredGene
  }) {
    this.cellA = cellA;
    this.cellB = cellB;

    this.plotData = pairwiseComparisonData;
    this.filteredPlotData = this.plotData.filter(gene => gene.pValue <= pValueThreshhold);

    this.savedGeneNames = savedGeneNames;

    this.render();
    this.updateHoveredGene({ hoveredGene });
  },

  updateHoveredGene({ hoveredGene }) {
    var { x, y, plotData } = this
      , hoveredGeneName = hoveredGene && hoveredGene.get('geneName')

    this.g.select('.hoverdot')
      .selectAll('circle')
      .transition()
        .duration(150)
        .style('opacity', 0)
        .remove()

    if (hoveredGene && plotData.has(hoveredGeneName)) {
      this.g.select('.hoverdot').datum(plotData.get(hoveredGeneName))
        .append('circle')
        .attr('cx', d => x(d.logCPM))
        .attr('cy', d => y(d.logFC))
        .attr('fill', 'rgba(255, 0, 0, 1)')
        .attr('r', 3)
    }
  },

  getBins() {
    var bin = require('../../utils/bin')
      , bins = bin(this.filteredPlotData.toArray(), this.x, this.y, GRID_SQUARE_UNIT)

    bins.forEach(geneBin => {
      geneBin.multiplier = GENE_BIN_MULTIPLIERS[geneBin.genes.length] || 1;
    });

    this.bins = bins;

    return bins;
  },

  render() {
    var { cellA, cellB, dimensions, savedGeneNames, setBrushedGenes, plotData } = this
      , bins = this.getBins()
      , container

    this.g.select('.squares').selectAll('rect').remove();
    this.g.select('.squares-overlay').selectAll('rect').remove();
    this.g.select('.dots').selectAll('circle').remove();

    this.svg.select('.plot-title').text(`${formatCellName(cellA)} - ${formatCellName(cellB)}`);

    container = this.g.select('.squares-overlay')[0][0];

    this.g.select('.squares')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', dimensions.PLOT_WIDTH)
      .attr('height', dimensions.PLOT_HEIGHT)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')

    this.binSelection = this.g.select('.squares').selectAll('rect').data(bins)
        .enter()
      .append('rect')
      .attr('x', d => d.x0 + ((1 - d.multiplier) / 2) * GRID_SQUARE_UNIT)
      .attr('y', d => d.y1 + ((1 - d.multiplier) / 2) * GRID_SQUARE_UNIT)
      .attr('width', d => GRID_SQUARE_UNIT * d.multiplier)
      .attr('height', d => GRID_SQUARE_UNIT * d.multiplier)
      .attr('fill', '#2566a8')

    this.g.select('.squares-overlay').selectAll('rect').data(bins)
        .enter()
      .append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y1)
      .attr('width', GRID_SQUARE_UNIT)
      .attr('height', GRID_SQUARE_UNIT)
      .attr('fill', '#2566a8')
      .attr('fill', 'transparent')
      .on('mouseover', function () {
        container.appendChild(this);
      })
      .on('click', function (d) {
        setBrushedGenes(Immutable.OrderedSet(d.genes.map(gene => gene.geneName)));
      })
      .append('title').text(d => d.genes.length)

    if (savedGeneNames) {
      let savedGenes = savedGeneNames.map(name => plotData.get(name)).filter(d => d).toArray()

      this.g.select('.dots').selectAll('circle').data(savedGenes)
          .enter()
        .append('circle')
        .attr('cx', d => this.x(d.logCPM))
        .attr('cy', d => this.y(d.logFC))
        .attr('r', 2)
        .attr('fill', 'red')
    }
  },
}

module.exports = React.createClass({
  displayName: 'CellPlot',

  propTypes: {
    cellA: React.PropTypes.string,
    cellB: React.PropTypes.string,
    pairwiseComparisonData: React.PropTypes.instanceOf(Immutable.Map),
    pValueThreshhold: React.PropTypes.number,
    savedGenes: React.PropTypes.instanceOf(Immutable.Set),
  },

  componentDidUpdate(prevProps) {
    var { cellA, cellB, pValueThreshhold, pairwiseComparisonData, hoveredGene, savedGeneNames } = this.props
      , { visualization } = this.state
      , needsUpdate

    needsUpdate = pairwiseComparisonData && !prevProps.pairwiseComparisonData || (
      pairwiseComparisonData &&
      prevProps.savedGeneNames !== savedGeneNames ||
      prevProps.cellA !== cellA ||
      prevProps.cellB !== cellB ||
      prevProps.pValueThreshhold !== pValueThreshhold
    )

    if (needsUpdate) {
      visualization.update(this.props);
    } else if (prevProps.hoveredGene !== hoveredGene) {
      visualization.updateHoveredGene(this.props);
    }
  },

  componentDidMount() {
    var { setBrushedGenes, width, height } = this.props

    this.setState({
      visualization: new PlotVisualization(this.refs.svg, getDimensions(width, height), setBrushedGenes)
    });
  },

  render() {
    var { width, height } = this.props

    return (
      <svg
          ref="svg"
          className="left"
          width={width}
          height={height} />
    )
  }
});
