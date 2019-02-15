"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , { connect  } = require('react-redux')
    , { getPlotBins } = require('../../utils')
    , Action = require('../../actions')
    , onResize = require('../util/Sized')

const padding = {
  l: 60,
  r: 20,
  t: 60,
  b: 60,
}

const GRID_SQUARE_UNIT = 8

const TRANSCRIPT_BIN_MULTIPLIERS = {
  1: .35,
  2: .5,
  3: .65,
  4: .8,
}

function withinBounds([min, max], value) {
  return value >= min && value <= max
}

class Plot extends React.Component {
  constructor() {
    super();

    this.state = {}
    this.drawAxes = this.drawAxes.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    const update = (
      props.width != null &&
      props.height != null &&
      props.width !== state.width &&
      props.height !== state.height
    )

    if (update) {
      const plotHeight = props.height - padding.t - padding.b
          , plotWidth = props.width - padding.l - padding.r

      const [ xDomain, yDomain ] = props.abundanceLimits

      return {
        height: props.height,
        width: props.width,
        plotHeight,
        plotWidth,
        xScale: d3.scaleLinear()
          .domain(xDomain)
          .range([0, plotWidth]),
        yScale: d3.scaleLinear()
          .domain(yDomain)
          .range([plotHeight, 0]),
      }
    }

    return null
  }

  componentDidUpdate(prevProps) {
    const didChange = lens =>
      R.view(lens, this.props) !== R.view(lens, prevProps)

    const redrawBins = (
      this.props.height != null && (
        didChange(R.lensProp('pairwiseData')) ||
        didChange(R.lensProp('pValueThreshold')) ||
        this.props.height !== prevProps.height
      )
    )

    const redrawAxes = (
      this.props.height != null &&
      this.props.height !== prevProps.height
    )

    if (!this.clearBrush) {
      this.initBrush()
    }

    if (redrawBins) {
      this.drawBins()
      this.drawSavedTranscripts()
      this.clearBrush()
    }

    if (redrawAxes) {
      this.drawAxes()
    }

    if (didChange(R.lensProp('hoveredTranscript'))) {
      this.updateHoveredTranscript()
    }

    if (didChange(R.lensProp('savedTranscripts'))) {
      this.drawSavedTranscripts()
    }
  }

  initBrush() {
    const { dispatch } = this.props
        , { xScale, yScale } = this.state

    if (!xScale) return

    const [ x0, x1 ] = xScale.domain().map(xScale)
    const [ y0, y1 ] = yScale.domain().map(yScale)

    const brush = this.brush = d3.brush()
      .extent([[x0, y1], [x1, y0]])
      .on('end', () => {
        if (!this.binSelection) return

        // Reset each bin to its original fill
        this.binSelection.attr('fill', d => d.color)

        if (!d3.event.selection) {
          dispatch(Action.SetBrushedTranscripts([]))
          return
        }

        const extent = d3.event.selection
            , cpmBounds = extent.map(R.head).map(xScale.invert).sort((a, b) => a - b)
            , fcBounds = extent.map(R.last).map(yScale.invert).sort((a, b) => a - b)

        // Filter based on whether this bin is within the brushed range
        const brushedBins = this.binSelection
          .filter(({ cpmMin, cpmMax, fcMin, fcMax }) =>
            (withinBounds(cpmBounds, cpmMin) || withinBounds(cpmBounds, cpmMax))
            &&
            (withinBounds(fcBounds, fcMin) || withinBounds(fcBounds, fcMax))
          )

        brushedBins.attr('fill', d => d.brushedColor)

        const brushedTranscripts = R.pipe(
          R.chain(R.prop('transcripts')),
          R.map(R.prop('id'))
        )(brushedBins.data())

        dispatch(Action.SetBrushedTranscripts(brushedTranscripts))
      })

    const brushSel = d3.select(this.plotG).select('.brush')

    brushSel.call(brush)

    this.clearBrush = () => brushSel.call(brush.move, null)
  }

  drawAxes() {
    const { xScale, yScale } = this.state

    const xEl = d3.select(this.svg)
      .select('.x-axis')

    xEl.selectAll('*').remove()

    xEl.call(d3.axisBottom().scale(xScale))

    const yEl = d3.select(this.svg)
      .select('.y-axis')

    yEl.selectAll('*').remove()

    yEl.call(d3.axisLeft().scale(yScale));

    yScale.ticks().forEach(y => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(xScale.domain()[0])))
        .attr('x2', Math.ceil(xScale(xScale.domain()[1])))
        .attr('y1', Math.ceil(yScale(y)))
        .attr('y2', Math.ceil(yScale(y)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    });

    xScale.ticks().forEach(x => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(x)))
        .attr('x2', Math.ceil(xScale(x)))
        .attr('y1', Math.ceil(yScale(yScale.domain()[0])))
        .attr('y2', Math.ceil(yScale(yScale.domain()[1])))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    })

  }

  drawBins() {
    const { xScale, yScale } = this.state
        , { pairwiseData, pValueThreshold } = this.props

    this.binSelection = null;

    d3.select(this.svg)
      .select('.squares')
      .selectAll('rect')
        .remove()

    d3.select(this.svg)
      .select('.squares')
      .selectAll('text')
        .remove()

    if (pairwiseData === null) {
      d3.select('.squares')
        .append('text')
        .attr('x', xScale(d3.mean(xScale.domain())))
        .attr('y', yScale(d3.mean(yScale.domain())))
        .text('No data available for comparison')
        .style('text-anchor', 'middle')

      return;
    }

    const bins = getPlotBins(
      [...pairwiseData.values()].filter(({ pValue }) => pValue <= pValueThreshold),
      xScale,
      yScale,
      8)

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([-300,150])

    const brushedColorScale = d3.scaleSequential(d3.interpolatePurples)
      .domain([-500,150])

    bins.forEach(bin => {
      bin.multiplier = TRANSCRIPT_BIN_MULTIPLIERS[bin.transcripts.length] || 1
      if (bin.transcripts.length < 5) {
        bin.color = colorScale(5)
        bin.brushedColor = brushedColorScale(5)
      } else if (bin.transcripts.length >= 150) {
        bin.color = colorScale(150)
        bin.brushedColor = brushedColorScale(150)
      } else {
        bin.color = colorScale(bin.transcripts.length)
        bin.brushedColor = brushedColorScale(bin.transcripts.length)
      }
    })

    this.binSelection = d3.select(this.svg)
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

  drawSavedTranscripts() {
    const { xScale, yScale } = this.state
        , { savedTranscripts, pairwiseData } = this.props

    if (!pairwiseData) return

    d3.select(this.svg)
      .select('.saved-transcripts')
      .selectAll('circle')
        .remove()

    d3.select(this.svg)
      .select('.saved-transcripts')
      .selectAll('circle')
      .data([...savedTranscripts])
          .enter()
        .append('circle')
        .attr('cx', d => xScale(pairwiseData.get(d).logATA))
        .attr('cy', d => yScale(pairwiseData.get(d).logFC))
        .attr('r', 2)
        .attr('fill', 'red')

  }

  updateHoveredTranscript() {
    const { xScale, yScale } = this.state
        , { hoveredTranscript, pairwiseData } = this.props

    const container = d3.select(this.svg).select('.hovered-marker')

    container.selectAll('circle')
      .transition()
      .duration(360)
      .ease(d3.easeCubicOut)
      .style('opacity', 0)
      .remove()

    if (hoveredTranscript === null) return;
    if (pairwiseData === null) return;

    const data = pairwiseData.get(hoveredTranscript)

    if (!data) return

    const { logATA, logFC } = data

    container.append('circle')
      .attr('cx', xScale(logATA))
      .attr('cy', yScale(logFC))
      .attr('r', 20)
      .attr('opacity', 1)
      .attr('fill', 'none')
      .attr('stroke', 'coral')
      .attr('stroke-width', 2)

    container.append('circle')
      .attr('cx', xScale(logATA))
      .attr('cy', yScale(logFC))
      .attr('opacity', 1)
      .attr('r', 3)
      .attr('fill', 'coral')
  }

  render() {
    const {
      height,
      width,
      plotHeight,
      plotWidth,
    } = this.state

    const { treatmentsLabel } = this.props

    if (this.props.width == null) {
      return null
    }

    return (
      h('div', {
        style: {
          height: '100%',
          width: '100%',
          position: 'relative',
        },
      }, [
        h('svg', {
          position: 'absolute',
          top: 0,
          bottom: 0,
          height: '100%',
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
          }, treatmentsLabel),

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
          }, 'log₂ (Average Transcript Abundance)'),

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
            },
          }, 'log₂ (Fold Change)'),

          h('g', {
            ref: el => this.plotG = el,
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

            h('g.saved-transcripts'),

            h('g.brush'),

            h('g.hovered-marker'),
          ]),
        ]),
      ])
    )
  }
}

module.exports = R.pipe(
  connect(R.applySpec({
    abundanceLimits: R.path(['currentView', 'project', 'metadata', 'abundanceLimits']),
    savedTranscripts: R.path(['currentView', 'savedTranscripts']),
    pairwiseData: R.path(['currentView', 'pairwiseData']),
    pValueThreshold: R.path(['currentView', 'pValueThreshold']),
    hoveredTranscript: R.path(['currentView', 'hoveredTranscript']),
    treatmentsLabel: state => {
      const view = state.currentView

      if (!view) return null

      const { project, comparedTreatments } = view

      return (comparedTreatments || [])
        .map(t => R.path(['treatments', t, 'label'], project) || t)
        .join(' vs. ')
    },
  })),
  onResize(el => ({
    width: el.clientWidth,
    height: el.clientHeight,
  }))
)(Plot)
