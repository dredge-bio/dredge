import h from 'react-hyperscript'
import * as R from 'ramda'
import * as d3 from 'd3'
import * as React from 'react'
import { connect } from 'react-redux'
import throttle from 'throttleit'
import styled from 'styled-components'

import { useOptions, ORGShellOptionsProps } from 'org-shell'

import { Flex, Button } from 'rebass'

import { getPlotBins, projectForView } from '../../utils'
import onResize from '../util/Sized'
import { MagnifyingGlass, Target, Reset } from '../Icons'
import { actions } from '../../view'
import padding from './padding'

import { useAppDispatch, useAppSelector } from '../../hooks'

import {
  PairwiseComparison
} from '../../types'

const GRID_SQUARE_UNIT = 8

const TRANSCRIPT_BIN_MULTIPLIERS = [
  0,
  .35,
  .5,
  .65,
  .8,
]

const help = {
  zoom: 'Use mouse/touchscreen to zoom and pan',
  select: 'Use mouse to select squares on the plot',
  drag: 'Use mouse/touchscreen to select an area on the plot',
  reset: 'Reset position of the plot',
}

type PlotProps = {
  loading: boolean,
  width: number;
  height: number;
  abundanceLimits: [[number, number], [number, number]];
  pairwiseData: PairwiseComparison | null;
  pValueThreshold: number;

  hoveredTranscript: string | null;
  savedTranscripts: Set<string>;

  // FIXME
  brushedArea: any;

  dispatch: ReturnType<typeof useAppDispatch>;
} & ORGShellOptionsProps

type PlotState = {
  width: number;
  height: number;

  plotWidth: number;
  plotHeight: number;

  xScale: d3.ScaleLinear<number, number> | null;
  yScale: d3.ScaleLinear<number, number> | null;
  dragAction: 'drag' | 'zoom',
  showHelp: 'drag' | 'zoom' | 'reset' | null,
  scaleTransform: d3.ZoomTransform,
}

function getDimensions(props: PlotProps, state?: PlotState) {
  const plotHeight = props.height! - padding.t - padding.b
      , plotWidth = props.width! - padding.l - padding.r

  const [ xDomain, yDomain ] = props.abundanceLimits

  const xScale = d3.scaleLinear()
    .domain(xDomain)
    .range([0, plotWidth])

  const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([plotHeight, 0])

  const scaleTransform = state
    ? state.scaleTransform
    : d3.zoomIdentity

  return {
    height: props.height,
    width: props.width,
    plotHeight,
    plotWidth,
    xScale: scaleTransform.rescaleX(xScale),
    yScale: scaleTransform.rescaleY(yScale),
    scaleTransform,
  }
}

export default class Plot extends React.Component<PlotProps, PlotState> {
  brush?: d3.BrushBehavior<unknown>;
  clearBrush?: () => void;
  setBrushCoords?: (coords: [number, number, number, number] | null) => void;

  constructor(props: PlotProps) {
    super(props);

    this.state = {
      dragAction: 'drag',
      showHelp: null,
      ...getDimensions(props)
    }

    this.drawAxes = this.drawAxes.bind(this)
  }

  static getDerivedStateFromProps(props: PlotProps, state: PlotState) {
    const update = (
      props.width !== state.width ||
      props.height !== state.height
    )

    if (update) {
      return getDimensions(props, state)
    }

    return null
  }

  componentDidUpdate(prevProps: PlotProps, prevState: PlotState) {
    const propChanged = (field: keyof PlotProps) =>
      prevProps[field] !== this.props[field]

    const stateChanged = (field: keyof PlotState) =>
      prevState[field] !== this.state[field]

    const dimensionsChanged = (
      propChanged('height') ||
      propChanged('width')
    )

    const scalesChanged = (
      stateChanged('xScale') ||
      stateChanged('yScale')
    )

    const redrawBins = (
      scalesChanged ||
      dimensionsChanged ||
      propChanged('pairwiseData') ||
      propChanged('pValueThreshold')
    )

    const resetInteraction = (
      !this.clearBrush ||
      dimensionsChanged ||
      stateChanged('dragAction')
    )

    const redrawAxes = (
      scalesChanged ||
      dimensionsChanged
    )

    const mustSetBrush = (
      this.state.dragAction === 'drag' &&
      propChanged('brushedArea')
    )

    if (resetInteraction) {
      this.initInteractionLayer()
    }

    if (mustSetBrush && this.setBrushCoords) {
      this.setBrushCoords(this.props.brushedArea)
    }

    if (redrawBins) {
      this.resetSelectedBin()
      this.drawBins()
      this.drawSavedTranscripts()
    }

    if (redrawAxes) {
      this.drawAxes()
    }

    if (propChanged('hoveredTranscript')) {
      this.updateHoveredTranscript()
    }

    if (propChanged('savedTranscripts')) {
      this.drawSavedTranscripts()
    }
  }

  initInteractionLayer() {
    const { updateOpts, dispatch } = this.props
        , { dragAction } = this.state

    d3.select('.interaction')
      .selectAll('*').remove()

    dispatch(actions.setHoveredBinTranscripts(null))
    dispatch(actions.setSelectedBinTranscripts(null))

    if (dragAction === 'drag') {
      this.initBrush()
    } else if (dragAction === 'zoom') {
      if (this.clearBrush) {
        this.clearBrush()
      }
      this.initZoom()
      updateOpts(R.omit(['brushed']))
    }
  }

  initZoom() {
    const { plotWidth, plotHeight, xScale, yScale } = this.state

    const el = d3.select('.interaction')
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', plotWidth!)
      .attr('height', plotHeight!)
      .attr('fill', 'blue')
      .attr('opacity', 0)

    const zoom = d3.zoom<SVGRectElement, unknown>()
      .on('zoom', (event: d3.D3ZoomEvent<SVGElement, any>) => {
        const { transform } = event

        this.setState({
          scaleTransform: transform,
        })
      })

    el.call(zoom)
  }

  initBrush() {
    const { updateOpts } = this.props
        , { xScale, yScale, dragAction } = this.state

    if (!xScale || !yScale) return

    const [ x0, x1 ] = xScale.domain().map(xScale)
    const [ y0, y1 ] = yScale.domain().map(yScale)

    const setBrush = throttle(extent => {
      const cpmBounds = extent.map(R.head).map(xScale.invert)
          , fcBounds = extent.map(R.last).map(yScale.invert)

      const coords = <[number, number, number, number]> [
        cpmBounds[0],
        fcBounds[0],
        cpmBounds[1],
        fcBounds[1],
      ].map(n => n.toFixed(3)).map(parseFloat)


      this.props.dispatch(actions.setBrushedArea(coords))
    }, 120)

    const brush = this.brush = d3.brush()
      .extent([[x0, y1], [x1, y0]])
      .on('brush', () => {
        if (!d3.event.sourceEvent) return
        if (!d3.event.selection) return

        const extent = d3.event.selection

        setBrush(extent)
      })
      .on('start', () => {
        this.binSelection
          .attr('stroke', 'none')
          .attr('class', '')

        this.props.dispatch(Action.SetHoveredBinTranscripts(null))
        this.props.dispatch(Action.SetSelectedBinTranscripts(null))
      })
      .on('end', () => {
        if (!d3.event.sourceEvent) return
        if (!this.binSelection) return

        // Reset each bin to its original fill
        this.binSelection.attr('fill', d => d.color)

        if (!d3.event.selection) {
          this.brushed = false;
          updateOpts(R.omit(['brushed']))
          if (dragAction === 'zoom') {
            this.initZoom()
          }
          return
        }

        this.brushed = true

        const extent = d3.event.selection
            , cpmBounds = extent.map(R.head).map(xScale.invert)
            , fcBounds = extent.map(R.last).map(yScale.invert)

        const coords = [
          cpmBounds[0],
          fcBounds[0],
          cpmBounds[1],
          fcBounds[1],
        ].map(n => n.toFixed(3)).map(parseFloat)

        setBrush(extent)

        updateOpts(opts => Object.assign({}, opts, { brushed: coords.join(',') }))
      })

    const brushSel = d3.select(this.plotG)
      .select('.interaction')
      .append('g')

    brushSel.call(brush)

    const that = this

    brushSel.select('rect')
      .on('mousemove', function () {
        if (that.brushed) return
        const [ x, y ] = d3.mouse(this)

        const inBin = that.binSelection.filter(({ x0, x1, y0, y1 }) => {
          return (
            (x >= x0 && x < x1) &&
            (y >= y1 && y < y0)
          )
        })

        const hoveredBin = inBin.size() ? inBin.datum() : null

        if (hoveredBin !== this._hoveredBin) {
          that.binSelection.attr('stroke', 'none')

          if (hoveredBin) {
            inBin.attr('stroke', 'red')
            that.props.dispatch(Action.SetHoveredBinTranscripts(new Set(
              hoveredBin.transcripts.map(t => t.name)
            )))
          } else {
            that.props.dispatch(Action.SetHoveredBinTranscripts(null))
          }

          this._hoveredBin = hoveredBin
          this._hoveredBinSelection = inBin
        }
      })
      .on('click', function () {
        if (d3.event.defaultPrevented) return

        that.binSelection.attr('class', '')

        if (this._hoveredBin) {
          const el = this._hoveredBinSelection.node()
          el.parentNode.appendChild(el)
          el.classList.add('bin-selected')

          that.props.dispatch(Action.SetSelectedBinTranscripts(new Set(
            this._hoveredBin.transcripts.map(t => t.name)
          )))
        }
      })

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

  resetSelectedBin() {
    const { dispatch } = this.props

    dispatch(Action.SetSelectedBinTranscripts(null))

    ;[...this.svg.querySelectorAll('.bin-selected')].forEach(el => {
      el.classList.remove('bin-selected')
    })
  }

  /*
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
  */

 /*
  drawBins() {
    const { xScale, yScale } = this.state
        , { loading, pairwiseData, pValueThreshold } = this.props

    this.binSelection = null;

    d3.select(this.svg)
      .select('.squares > g')
      .remove()

    if (loading) return;

    if (pairwiseData === null) {
      d3.select('.squares')
        .append('g')
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

    this.bins = bins

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([-300,150])

    const brushedColorScale = d3.scaleSequential(d3.interpolatePurples)
      .domain([-500,150])

    bins.forEach(bin => {
      if (!bin.transcripts.length) return

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
      .append('g')
      .selectAll('rect')
      .data(bins.filter(b => b.transcripts.length)).enter()
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
      */

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

  /*
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
  */

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

    const {
      dispatch,
      updateOpts,
      treatmentA,
      treatmentB,
      treatmentALabel,
      treatmentBLabel,
    } = this.props

    if (this.props.width == null) {
      return null
    }

    return (
      h('div', [
        showHelp == null ? null : (
          h('p.help-text', help[showHelp])
        ),

        h(TreatmentLabels, {
        }, [
          h('div', {
            onMouseLeave() {
              dispatch(Action.SetHoveredTreatment(null))
            },
            onMouseEnter() {
              dispatch(Action.SetHoveredTreatment(treatmentA))
            },
          }, treatmentALabel),
          h('span', {
          }, 'vs.'),
          h('div', {
            onMouseLeave() {
              dispatch(Action.SetHoveredTreatment(null))
            },
            onMouseEnter() {
              dispatch(Action.SetHoveredTreatment(treatmentB))
            },
          }, treatmentBLabel),
        ]),

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
                  this.setState({ dragAction: 'drag' })
                },
                onMouseEnter: () => {
                  this.setState({ showHelp: 'drag' })
                },
                onMouseLeave: () => {
                  this.setState({ showHelp: null })
                },
                ['data-active']: dragAction === 'drag',
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
                  zoomedXScale: null,
                  zoomedYScale: null,
                  transform: d3.zoomIdentity,
                }, () => {
                  this.initInteractionLayer()
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
