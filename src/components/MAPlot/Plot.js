"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , getBins = require('../../utils/bin')

const padding = {
  l: 60,
  r: 20,
  t: 60,
  b: 60,
}

const GRID_SQUARE_UNIT = 8

const GENE_BIN_MULTIPLIERS = {
  1: .35,
  2: .5,
  3: .65,
  4: .8,
}


class Plot extends React.Component {
  constructor() {
    super();

    this.state = {}
    this.drawAxes = this.drawAxes.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.height !== state.height || props.width !== state.width) {
      const plotHeight = props.height - padding.t - padding.b
          , plotWidth = props.width - padding.l - padding.r

      return {
        height: props.height,
        width: props.width,
        plotHeight,
        plotWidth,
        xScale: d3.scaleLinear()
          .domain([0, 16])
          .range([0, plotWidth]),
        yScale: d3.scaleLinear()
          .domain([-20, 20])
          .range([plotHeight, 0]),
      }
    }

    return null
  }

  componentDidUpdate(prevProps) {
    const dataLens = R.lensPath(['view', 'pairwiseData'])
        , updatedData = R.view(dataLens, this.props)

    if (updatedData && updatedData !== R.view(dataLens, prevProps)) {
      this.drawBins()
    }
  }

  componentDidMount() {
    this.drawAxes()
  }

  drawAxes() {
    const { xScale, yScale } = this.state

    const xEl = d3.select(this.svg)
      .select('.x-axis')

    xEl.call(d3.axisBottom().scale(xScale))

    const yEl = d3.select(this.svg)
      .select('.y-axis')

    yEl.call(d3.axisLeft().scale(yScale));

    yScale.ticks().forEach(y => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(0)))
        .attr('x2', Math.ceil(xScale(16)))
        .attr('y1', Math.ceil(yScale(y)))
        .attr('y2', Math.ceil(yScale(y)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    });

    xScale.ticks().forEach(x => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(x)))
        .attr('x2', Math.ceil(xScale(x)))
        .attr('y1', Math.ceil(yScale(20)))
        .attr('y2', Math.ceil(yScale(-20)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    })

  }

  drawBins() {
    const { xScale, yScale } = this.state
        , { pairwiseData } = this.props.view
        , bins = getBins(pairwiseData, xScale, yScale, 8)

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([-300,150])

    bins.forEach(bin => {
      bin.multiplier = GENE_BIN_MULTIPLIERS[bin.genes.length] || 1
      if (bin.genes.length < 5) {
        bin.color = colorScale(5)
      } else if (bin.genes.length >= 150) {
        bin.color = colorScale(150)
      } else {
        bin.color = colorScale(bin.genes.length)
      }
    })

    d3.select(this.svg)
      .select('.squares')
      .selectAll('rect')
        .remove()

    d3.select(this.svg)
      .select('.squares')
      .selectAll('rect')
      .data(bins).enter()
        .append('rect')
        .attr('x', d => d.x0 + (1 - d.multiplier) / 2 * GRID_SQUARE_UNIT)
        .attr('y', d => d.y1 + (1 - d.multiplier) / 2 * GRID_SQUARE_UNIT)
        .attr('width', d => GRID_SQUARE_UNIT * d.multiplier)
        .attr('height', d => GRID_SQUARE_UNIT * d.multiplier)
        .attr('fill', d => d.color)
  }

  render() {
    const {
      height,
      width,
      plotHeight,
      plotWidth,
    } = this.state

    const { view={} } = this.props
        , { comparedTreatments } = view

    const treatmentsText = (comparedTreatments || []).join('-')

    return (
      h('svg', {
        viewBox: `0 0 ${width} ${height}`,
        ref: el => { this.svg = el },
      }, [
        h('text', {
          x: width - padding.r,
          y: padding.t - 4,
          style: {
            fontSize: 24,
            fontWeight: 'bold',
            textAnchor: 'end',
            dominantBaseline: 'ideographic',
          },
        }, treatmentsText),

        // X Axis label
        h('text', {
          dx: padding.l,
          dy: padding.t,
          x: plotWidth / 2,
          y: plotHeight + (padding.b / 2) + 6, // extra pixels to bump it down from axis
          style: {
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'central',
          },
        }, 'log₂ (Average Transcript Level)'),

        // Y Axis label
        h('text', {
          x: 0,
          y: (plotHeight / 2) + padding.t,
          transform: `
            rotate(-90, 0, ${plotHeight / 2 + padding.t})
            translate(0, ${padding.l / 2 - 6})
          `,
          style: {
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'central',
          }
        }, 'log₂ (Fold Change)'),

        h('g', {
          transform: `translate(${padding.l}, ${padding.t})`,
        }, [
          h('rect', {
            fill: '#f9f9f9',
            stroke: '#ccc',
            x: 0,
            y: 0,
            width: plotWidth,
            height: plotHeight,
          }),

          h('g.x-axis', {
            transform: `translate(0, ${plotHeight})`,
          }),
          h('g.y-axis'),

          h('g.squares'),
        ]),

      ])
    )
  }
}

module.exports = Plot
