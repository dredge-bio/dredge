"use strict"

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , d3 = require('d3')
    , { Flex, Box } = require('rebass')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default

const PValueSelectorContainer = styled.div`
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

  .pvalue-histogram > div {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .pvalue-histogram input {
    -webkit-appearance: slider-vertical;
  }

  .histogram-bar {
    position: absolute;
    background: maroon;
  }
`

class PValueSelector extends React.Component {
  constructor() {
    super();

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(e) {
    const { updateOpts } = this.props

    const threshold = e.target.value != undefined
      ? parseFloat(e.target.value)
      : parseFloat(e.target.dataset.threshold)

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

    let bins, scale

    const pv = R.prop('pValue')
        , l = R.prop('length')

    // this STARTS at .00
    if (pairwiseData) {
      const histogram = d3.histogram()
        .value(pv)
        .domain([0, 1])
        .thresholds(100)

      bins = histogram([...pairwiseData.values()]).map(l)

      scale = d3.scaleLinear()
        .domain([0, d3.max(bins)])
        .range([0, 100])
    }

    return (
      h(PValueSelectorContainer, [
        h('div', [
          'p-value cutoff',
        ]),

        h(Flex, {
          alignItems: 'center',
        }, [
          h('span', {
            style: {
              whiteSpace: 'nowrap',
            },
          }, pValueThreshold),
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

              this.handleChange({ target: { value }})
            },
          }, 'change'),
        ]),

        h('div.pvalue-histogram', [
          h('input', {
            ref: el => { this.rangeEl = el },
            type: 'range',
            orient: 'vertical',
            value: pValueThreshold,
            style: {
              position: 'absolute',
              width: 18,
              height: '100%',
            },
            onChange: this.handleChange,
            min: '0',
            max: '1',
            step: '.01',
          }),

          h('div', {
            style: {
              position: 'absolute',
              height: '100%',
              left: 18,
              right: 0,
            },
          }, bins && bins.reverse().map((ct, i) => h('span', {
              key: `${comparedTreatments}-${i}`,
              title: (1 - i / 100).toFixed(2),
              className: 'histogram-bar',
              onClick: this.handleChange,
              ['data-threshold']: (1 - i / 100),
              style: {
                height: '1%',
                top: `${i}%`,
                width: `${scale(ct)}%`,
                opacity: 100 - i <= pValueThreshold * 100 ? 1 : .33,
              },
          }))),
        ]),
      ])
    )
  }
}

module.exports  = connect(R.pipe(
  R.prop('view'),
  R.pick(['comparedTreatments', 'pValueThreshold', 'pairwiseData'])
))(PValueSelector)
