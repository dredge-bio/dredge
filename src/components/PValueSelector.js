"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , d3 = require('d3')
    , debounce = require('debounce')
    , { Flex, Button } = require('rebass')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default
    , { formatNumber } = require('../utils')
    , onResize = require('./util/Sized')
    , { Reset } = require('./Icons')

const PValueSelectorContainer = styled.div`
  position: absolute;
  top: 6px;
  bottom: 58px;
  left: 0;
  right: 20px;


  display: flex;
  flex-direction: column;

  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px;
  margin: 0 -4px;

  & > :not([class="pvalue-histogram"]) {
    margin-bottom: 1rem;
    flex-grow: auto;
  }

  .pvalue-histogram {
    flex: 1 1 0;
    position: relative;
  }

  .p-controller button {
    padding: 4px 6px;
  }

  .p-controller > :first-child {
    flex-grow: 1;
    border-radius: 4px 0 0 4px;
    margin-right: -1px;
    text-align: left;
    font-weight: 100;
  }
  .p-controller > :last-child {
    border-radius: 0 4px 4px 0;
    background-color: #f0f0f0;
  }

  .p-controller > :hover {
    background-color: #e0e0e0;
  }

  .p-controller :focus {
    z-index: 1
  }

  .histogram {
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    background-color: #f9f9f9;
    border: 1px solid #ccc;
  }

  .pvalue-histogram input {
    -webkit-appearance: slider-vertical;
  }

  .histogram-bar {
    background: maroon;
  }

  .histogram-brush {
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    border: 1px solid #ccc;
    cursor: ns-resize;
  }

  .brush-container .handle,
  .brush-container .selection {
    display: none;
  }

  .brush-container .overlay {
    cursor: ns-resize;
  }

`

const PValueBrush = onResize(el => ({
  height: el.clientHeight,
  width: el.clientWidth,
}))(class PValueBrush extends React.Component {
  constructor() {
    super();
    this.state = {
      hoveredPValue: null,
      hoveredPosition: null,
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.height === undefined) return

    const dimensionsChanged = (
      prevProps.height !== this.props.height ||
      prevProps.width !== this.props.width
    )

    const treatmentsChanged = (
      prevProps.comparedTreatments !== this.props.comparedTreatments
    )

    if (!this.brush || dimensionsChanged || treatmentsChanged) {
      this.drawBrush()
    }
  }

  drawBrush() {
    const { width, height, scale: _scale, onPValueChange } = this.props

    if (width == null) return

    const scale = _scale.range([height, 0])

    d3.select(this.svg).selectAll('*').remove()

    const g = d3.select(this.svg)
      .append('g')
      .on('mouseleave', () => {
        this.setState({ hoveredPValue: null })
      })
      .on('mousemove', () => {
        this.setState({
          hoveredPValue: scale.invert(d3.event.offsetY),
          hoveredPosition: d3.event.offsetY,
        })
      })

    const update = x => {
      const val = x
      onPValueChange(scale.invert(val))
    }

    const brush = d3.brushY()
      .on('start', () => {
        const { selection } = d3.event
            , [ val ] = selection

        this.setState({
          brushStart: val,
        })

        update(val)
      })
      .on('brush', () => {
        const { selection } = d3.event
            , { brushStart } = this.state

        let [ val ] = selection.filter(x => x !== brushStart)

        if (val === undefined) {
          val = brushStart
        }

        update(val)
        this.setState({
          hoveredPValue: scale.invert(val),
          hoveredPosition: val,
        })
      })

    g.call(brush)
    this.brush = brush
  }

  render() {
    const { height, width } = this.props
        , { hoveredPValue, hoveredPosition } = this.state

    return (
      h('div', [
        h('svg.brush-container', {
          style: {
            position: 'absolute',
          },
          width,
          height,
          ref: el => this.svg = el,
        }),

        hoveredPValue === null ? null : h('span', {
          style: {
            position: 'absolute',
            left: '100%',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            padding: '6px',
            zIndex: 1,
            top: hoveredPosition,
            marginTop: '-16px',
          },
        }, formatNumber(hoveredPValue)),
      ])
    )
  }
})

class PValueSelector extends React.Component {
  constructor() {
    super();

    this.handleChange = debounce(this.handleChange.bind(this), 5)
  }

  handleChange(e) {
    const { updateOpts } = this.props

    let threshold

    if (typeof e === 'number') {
      threshold = e;
    } else if (e.target.value != undefined) {
      threshold = this.logScale.invert(this.ticks.length - parseFloat(e.target.value))
    } else {
      threshold = parseFloat(e.target.dataset.threshold)
    }

    if (threshold < (this.scaleMinimum * 1.5)) {
      threshold = 0;
    } else if (threshold > 1) {
      threshold = 1;
    } else {
      threshold = parseFloat(formatNumber(threshold))
    }

    if (isNaN(threshold)) return

    updateOpts(opts =>
      threshold === 1
        ? R.omit(['p'], opts)
        : Object.assign({}, opts, { p: threshold }))
  }

  render () {
    const {
      comparedTreatments,
      pValueThreshold,
      pairwiseData,
    } = this.props

    let logScale

    const pv = R.prop('pValue')
        , l = R.prop('length')

    if (!pairwiseData) return null

    const { minPValue } = pairwiseData

    const scaleMinimum = (
      Math.pow(10, Math.floor(Math.log10(minPValue)) - 1))

    logScale = d3.scaleLog()
      .domain([scaleMinimum, 1])

    const ticks = [0, ...logScale.ticks(100)]

    logScale = logScale.range([ticks.length, 0])

    const histogram = d3.histogram()
      .value(pv)
      .domain([0, 1])
      .thresholds(ticks)

    const bins = histogram([...pairwiseData.values()]).map(l)

    const scale = d3.scaleLinear()
      .domain([0, d3.max(bins)])
      .range([0, 100])

    this.ticks = ticks;
    this.logScale = logScale;
    this.scaleMinimum = scaleMinimum;

    return (
      h(PValueSelectorContainer, [
        h('p', [
          'P value cutoff',
        ]),

        h(Flex, { className: 'p-controller' }, [
          h(Button, {
            onClick: () => {
              let value

              try {
                value = prompt('Enter a p-value. (e.g. .0005, 1e-24)', pValueThreshold)
                value = parseFloat(value)
                if (isNaN(value)) throw new Error()
                if (value > 1) throw new Error()
              } catch (e) {
                value = 1
              }

              this.handleChange(value)
            },
          }, [
            formatNumber(pValueThreshold),
          ]),
          h(Button, {
            onClick: () => {
              this.handleChange(1)
            },
            style: {
              display: 'flex',
            },
          }, [
            h(Reset, { height: 12 }),
          ]),
        ]),

        h('div.pvalue-histogram', [
          h('div.histogram', {}, bins && bins.reverse().map((ct, i) =>
            h('span.histogram-bar', {
              key: `${comparedTreatments}-${i}`,
              style: {
                height: `${100 / ticks.length}%`,
                top: `${i * (100 / ticks.length)}%`,
                width: ct === 0 ? 0 : `${scale(ct)}%`,
                minWidth: ct === 0 ? 0 : '2px',
                opacity: logScale.invert(i) <= pValueThreshold ? 1 : .33,
              },
          }))),

          h(PValueBrush, {
            scale: logScale,
            onPValueChange: this.handleChange,
            comparedTreatments,
          }),
        ]),
      ])
    )
  }
}

module.exports  = connect(R.pipe(
  R.prop('view'),
  R.pick(['comparedTreatments', 'pValueThreshold', 'pairwiseData'])
))(PValueSelector)
