"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , d3 = require('d3')
    , { Flex, Box } = require('rebass')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default
    , throttle = require('throttleit')
    , { formatNumber } = require('../utils')
    , onResize = require('./util/Sized')

const PValueSelectorContainer = styled.div`
  position: absolute;
  top: 0;
  bottom:0;

  display: flex;
  flex-direction: column;
  height: 100%;

  & > :not([class="pvalue-histogram"]) {
    margin-bottom: 1rem;
    flex-grow: auto;
  }

  .pvalue-histogram {
    flex-grow: 1;
    position: relative;
  }

  .histogram {
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    background-color: white;
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
`

const PValueBrush = onResize(el => ({
  boundingRect: el.getBoundingClientRect(),
}))(class PValueBrush extends React.Component {
  constructor() {
    super();
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 10)
    this.setPValue = this.setPValue.bind(this)

    this.state = {
      clicking: false,
      hovering: false,
      hoveredPValue: null,
    }
  }

  handleMouseMove(e) {
    const { scale, boundingRect } = this.props

    let pos = e.pageY - boundingRect.y

    if (pos < 0) pos = 0;
    if (pos > boundingRect.height) pos = boundingRect.height

    let val = formatNumber(
      scale.range([boundingRect.height, 0])
        .invert(pos), 2)

    val = parseFloat(val)

    if (!isNaN(val)) {
      this.setState({
        hoveredPValue: val,
        offsetTop: pos,
      }, () => {
        if (this.state.clicking) {
          this.setPValue()
        }
      })

    }
  }

  setPValue() {
    const { onPValueChange } = this.props

    onPValueChange(this.state.hoveredPValue)
  }

  render() {
    const { offsetTop, hoveredPValue } = this.state

    return (
      h('div.histogram-brush', {
        onClick: this.setPValue,

        onMouseDown: () => {
          this.setState({ clicking: true })
        },

        onMouseUp: () => {
          this.setState({ clicking: false })
        },

        onMouseEnter: () => {
          this.setState({ hovering: true })
        },
        onMouseLeave: () => {
          this.setState({ hovering: false, hoveredPValue: null, offsetTop: null })
        },
        onMouseMove: this.handleMouseMove,
      }, [
        offsetTop == null ? null : h('span', {
          style: {
            position: 'absolute',
            left: '100%',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            whiteSpace: 'nowrap',
            padding: '6px',
            zIndex: 1,
            top: offsetTop,
            marginTop: '-16px',
          },
        }, hoveredPValue),

        offsetTop == null ? null : h('span', {
          style: {
            position: 'absolute',
            top: offsetTop,
            height: '1px',
            left: 0,
            right: 0,
            backgroundColor: '#666',
          }
        })
      ])
    )
  }
})

class PValueSelector extends React.Component {
  constructor() {
    super();

    this.handleChange = this.handleChange.bind(this)
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
        h('div', {
          style: {
            whiteSpace: 'nowrap',
          },
        }, [
          'p-value cutoff',
        ]),

        h(Flex, {
          alignItems: 'center',
        }, [
          h('span', {
            style: {
              whiteSpace: 'nowrap',
            },
          }, formatNumber(pValueThreshold)),
          h(Box, {
            as: 'button',
            ml: 2,
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
          }, 'change'),
        ]),

        h('div.pvalue-histogram', [
          /*
          h('input', {
            ref: el => { this.rangeEl = el },
            type: 'range',
            orient: 'vertical',
            value: pValueThreshold === 0
              ? 0
              : ticks.length - logScale(pValueThreshold),
            style: {
              position: 'absolute',
              width: 18,
              height: '100%',
            },
            onChange: this.handleChange,
            min: '0',
            max: '' + ticks.length,
          }),
          */

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
