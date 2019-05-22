"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , { connect  } = require('react-redux')
    , styled = require('styled-components').default
    , { getPlotBins, projectForView } = require('../../utils')
    , onResize = require('../util/Sized')
    , { Flex, Button } = require('rebass')

const PlotWrapper = styled.div`
.button-group {
  display: flex;
}

.button-group button:last-of-type {
  border-radius: 0 4px 4px 0;
}

.button-group button:first-of-type {
  border-radius: 4px 0 0 4px;
}

.button-group button + button {
  margin-left: -1px;
}

[data-active] {
  position: relative;
}

[data-active]:focus {
  z-index: 1;
}

[data-active="true"]::after {
  position: absolute;
  content: " ";
  left: 4px;
  right: 4px;
  height: 2px;
  background-color: hsl(205,35%,45%);
  bottom: -8px;
  border: 1px solid #eee;
  box-shadow: 0 0 0 1px #eee;
}

.help-text {
  position: absolute;
  left: ${props => props.padding.l + 16 }px;
  right: ${props => props.padding.r + 16 }px;
  top: ${props => props.padding.t + 8 }px;
  padding: .66rem;
  background-color: hsl(205,35%,85%);
  border: 1px solid hsl(205,35%,45%);
  text-align: center;
}
`

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

const MagnifyingGlass = ({
  stroke='black',
  strokeWidth=2,
  height=16,
  width=16,
}) =>
  h('svg', {
    width,
    height,
    viewBox: '0 0 24 24',
    stroke,
    strokeWidth,
    fill: 'none',
  }, [
    h('circle', {
      cx: 11,
      cy: 11,
      r: 6,
    }),
    h('line', {
      x1: 21,
      y1: 21,
      x2: 14.65,
      y2: 14.65,
    }),
  ])

const Target = ({
  stroke='black',
  strokeWidth=2,
  height=16,
  width=16,
}) =>
  h('svg', {
    width,
    height,
    viewBox: '0 0 24 24',
    stroke,
    strokeWidth,
    fill: 'none',
  }, [
    h('line', {
      x1: 12,
      y1: 1,
      x2: 12,
      y2: 8,
    }),

    h('line', {
      x1: 12,
      y1: 16,
      x2: 12,
      y2: 23,
    }),

    h('line', {
      x1: 1,
      y1: 12,
      x2: 8,
      y2: 12,
    }),

    h('line', {
      x1: 16,
      y1: 12,
      x2: 23,
      y2: 12,
    }),

  ])

const Reset = ({
  stroke='black',
  strokeWidth=2,
  height=16,
  width=16,
}) =>
  h('svg', {
    width,
    height,
    viewBox: '0 0 24 24',
    stroke,
    strokeWidth,
    fill: 'none',
  }, [
    h('path', {
      d: 'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38',
    }),
  ])

const help = {
  zoom: 'Use mouse/touchscreen to zoom and pan',
  select: 'Use mouse/touchscreen to select transcripts on the plot',
  reset: 'Reset position of the plot',
}

class Plot extends React.Component {
  constructor() {
    super();

    this.state = {
      xScale: null,
      yScale: null,
      dragAction: 'select',
      showHelp: null,
      transform: d3.zoomIdentity,
    }
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

      const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([0, plotWidth])

      const yScale = d3.scaleLinear()
          .domain(yDomain)
          .range([plotHeight, 0])

      return {
        height: props.height,
        width: props.width,
        plotHeight,
        plotWidth,
        xScale: state.transform.rescaleX(xScale),
        yScale: state.transform.rescaleY(yScale),
        _xScale: xScale,
        _yScale: yScale,
      }
    }

    return null
  }

  componentDidUpdate(prevProps, prevState) {
    const propChanged = lens =>
      R.view(lens, this.props) !== R.view(lens, prevProps)

    const stateChanged = lens =>
      R.view(lens, this.state) !== R.view(lens, prevState)

    const hasDimensions = (
      this.props.height != null && this.props.width != null
    )

    if (!hasDimensions) return

    const dimensionsChanged = (
      propChanged(R.lensProp('height')) ||
      propChanged(R.lensProp('width'))
    )

    const scalesChanged = (
      stateChanged(R.lensProp('xScale')) ||
      stateChanged(R.lensProp('yScale'))
    )

    const redrawBins = (
      scalesChanged ||
      dimensionsChanged ||
      propChanged(R.lensProp('pairwiseData')) ||
      propChanged(R.lensProp('pValueThreshold'))
    )

    const resetInteraction = (
      !this.clearBrush ||
      dimensionsChanged ||
      stateChanged(R.lensProp('dragAction'))
    )

    const redrawAxes = (
      scalesChanged ||
      dimensionsChanged
    )

    const mustSetBrush = (
      this.state.dragAction === 'select' &&
      propChanged(R.lensProp('brushedArea'))
    )

    if (resetInteraction) {
      this.initInteractionLayer()
    }

    if (mustSetBrush) {
      this.setBrushCoords(this.props.brushedArea)
    }

    if (redrawBins) {
      this.drawBins()
      this.drawSavedTranscripts()
    }

    if (redrawAxes) {
      this.drawAxes()
    }

    if (propChanged(R.lensProp('hoveredTranscript'))) {
      this.updateHoveredTranscript()
    }

    if (propChanged(R.lensProp('savedTranscripts'))) {
      this.drawSavedTranscripts()
    }

  }

  initInteractionLayer() {
    const { dragAction } = this.state

    if (!this.i) {
      this.i = 0
    }

    d3.select('.interaction')
      .selectAll('*').remove()

    if (dragAction === 'select') {
      this.initBrush()
    } else if (dragAction === 'zoom') {
      this.clearBrush()
      this.initZoom()
    }
  }

  initZoom() {
    const { plotWidth, plotHeight, xScale, yScale } = this.state

    const el = d3.select('.interaction')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', plotWidth)
      .attr('height', plotHeight)
      .attr('fill', 'blue')
      .attr('opacity', 0)

    // TODO: Do something like this:
    // - Transform the bins on the initial zoom interaction
    // - Reset the bins after zoom is finished for N ms (150? 250?)
    // - Don't reset bins after panning (?).. Eh, that might not work.
    const zoom = d3.zoom()
      .on('zoom', () => {
        const transform = d3.event.transform

        this.setState({
          transform,
          xScale: transform.rescaleX(xScale),
          yScale: transform.rescaleY(yScale),
        })
        // d3.select(this.svg).select('.squares').attr('transform', d3.event.transform)
      })

    this.resetZoom = () => {
      el.call(zoom.transform, d3.zoomIdentity)
    }

    el.call(zoom)
  }

  initBrush() {
    const { updateOpts } = this.props
        , { xScale, yScale, dragAction } = this.state

    if (!xScale) return
    const [ x0, x1 ] = xScale.domain().map(xScale)
    const [ y0, y1 ] = yScale.domain().map(yScale)

    const brush = this.brush = d3.brush()
      .extent([[x0, y1], [x1, y0]])
      .on('end', () => {
        if (!d3.event.sourceEvent) return
        if (!this.binSelection) return

        // Reset each bin to its original fill
        this.binSelection.attr('fill', d => d.color)

        if (!d3.event.selection) {
          updateOpts(R.omit(['brushed']))
          if (dragAction === 'zoom') {
            this.initZoom()
          }
          return
        }

        const extent = d3.event.selection
            , cpmBounds = extent.map(R.head).map(xScale.invert)
            , fcBounds = extent.map(R.last).map(yScale.invert)

        const coords = [
          cpmBounds[0],
          fcBounds[0],
          cpmBounds[1],
          fcBounds[1],
        ].map(n => n.toFixed(3)).map(parseFloat)

        updateOpts(opts => Object.assign({}, opts, { brushed: coords.join(',') }))
      })

    const brushSel = d3.select(this.plotG)
      .select('.interaction')
      .append('g')

    brushSel.call(brush)

    this.clearBrush = () => brushSel.call(brush.move, null)
    this.setBrushCoords = coords => {
      if (coords == null) {
        this.clearBrush()
        return
      }

      const [ x0, y0, x1, y1 ] = coords

      brush.move(brushSel, [
        [xScale(x0), yScale(y0)],
        [xScale(x1), yScale(y1)],
      ])
    }
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
      pairwiseData,
      ({ pValue }) => pValue <= pValueThreshold,
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

    d3.select('defs').selectAll('*').remove()

    d3.select('defs')
      .append('clipPath')
      .attr('id', 'visible-plot')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', xScale.range()[1])
      .attr('height', yScale.range()[0])

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
      .data([...savedTranscripts].filter(x => pairwiseData.has(x)))
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
      dragAction,
      showHelp,
      _xScale,
      _yScale,
    } = this.state

    const { treatmentALabel, treatmentBLabel, updateOpts } = this.props

    if (this.props.width == null) {
      return null
    }

    return (
      h(PlotWrapper, {
        padding,
        style: {
          height: '100%',
          width: '100%',
          position: 'relative',
        },
      }, [
        showHelp == null ? null : (
          h('p.help-text', help[showHelp])
        ),

        h('div', {
          style: {
            position: 'absolute',
            right: padding.r,
            top: 6,
            width: 146,
            height: padding.t - 6,
            background: '#eee',
            border: '1px solid #ccc',
            borderRadius: '4px 4px 0 0',
            borderBottom: 'none',
          },
        }, [
          h(Flex, {
            className: 'toolbar',
            p: 2,
          }, [
            h('.button-group', [
              h(Button, {
                onClick: () => {
                  this.setState({ dragAction: 'select' })
                },
                onMouseEnter: () => {
                  this.setState({ showHelp: 'select' })
                },
                onMouseLeave: () => {
                  this.setState({ showHelp: null })
                },
                ['data-active']: dragAction === 'select',
              }, h(Target)),
              h(Button, {
                onClick: () => {
                  this.setState({ dragAction: 'zoom' })
                },
                onMouseEnter: () => {
                  this.setState({ showHelp: 'zoom' })
                },
                onMouseLeave: () => {
                  this.setState({ showHelp: null })
                },
                ['data-active']: dragAction === 'zoom',
              }, h(MagnifyingGlass)),
            ]),
            h(Button, {
              ml: 1,
              onMouseEnter: () => {
                this.setState({ showHelp: 'reset' })
              },
              onMouseLeave: () => {
                this.setState({ showHelp: null })
              },
              onClick: () => {
                if (this.state.transform === d3.zoomIdentity) return

                this.clearBrush()
                updateOpts(R.omit(['brushed']))

                this.setState({
                  xScale: _xScale,
                  yScale: _yScale,
                  transform: d3.zoomIdentity,
                }, () => {
                  if (this.state.dragAction === 'zoom') {
                    this.resetZoom()
                  }
                })
              },
            }, h(Reset)),
          ]),
        ]),
        h('svg', {
          position: 'absolute',
          top: 0,
          bottom: 0,
          height: '100%',
          viewBox: `0 0 ${width} ${height}`,
          ref: el => { this.svg = el },
        }, [
          h('defs', [
          ]),

          h('text', {
            x: padding.l + 8,
            y: padding.t - 30,
            style: {
              fontSize: 20,
              fontWeight: 'bold',
              textAnchor: 'start',
              dominantBaseline: 'ideographic',
            },
          }, treatmentALabel ),

          h('text', {
            x: padding.l + 8,
            y: padding.t - 6,
            style: {
              fontSize: 20,
              fontWeight: 'bold',
              textAnchor: 'start',
              dominantBaseline: 'ideographic',
            },
          }, treatmentBLabel ),

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

            h('g', { clipPath: 'url(#visible-plot)' }, [
              h('g.squares'),

              h('g.saved-transcripts'),

              h('g.interaction'),

              h('g.hovered-marker'),
            ]),
          ]),
        ]),
      ])
    )
  }
}

module.exports = R.pipe(
  connect(state => {
    const project = projectForView(state) || {}

    let treatmentALabel
      , treatmentBLabel

    {
      const { view } = state

      if (view) {
        const { comparedTreatments=[] } = view;

        [ treatmentALabel, treatmentBLabel ] = comparedTreatments
          .map(t => R.path(['treatments', t, 'label'], project) || t)
      }
    }
    return Object.assign({
      abundanceLimits: R.path(['config', 'abundanceLimits'], project),
      treatmentALabel,
      treatmentBLabel,
    }, R.pick([
      'brushedArea',
      'savedTranscripts',
      'pairwiseData',
      'pValueThreshold',
      'hoveredTranscript',
    ], state.view))
  }),
  onResize(el => ({
    width: el.clientWidth,
    height: el.clientHeight,
  }))
)(Plot)
