"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , d3 = require('d3')

module.exports = React.createClass({
  displayName: 'PValueSelector',

  propTypes: {
    setPValueThreshhold: React.PropTypes.func.isRequired,
    data: React.PropTypes.instanceOf(Immutable.Map),
  },

  componentDidMount() {
    this.refs.range.setAttribute('orient', 'vertical')
  },

  render () {
    const {
      cellA,
      cellB,
      pValueThreshhold,
      width,
      height,
      setBrushedGenes,
      setPValueThreshhold,
      pairwiseComparisonData,
    } = this.props

    let histogram, scale

    // this STARTS at .00
    if (pairwiseComparisonData) {
      histogram = d3.layout.histogram().bins(100).value(d => d.pValue)
      histogram = histogram(pairwiseComparisonData.toArray())
      histogram = histogram.map(d => d.length)

      scale = d3.scale.linear().domain([0, d3.max(histogram)]).range([0, 100])
    }

    return h(
      'div',
      { className: 'left border-box py2 flex flex-column', style: { width, height } },
      h(
        'div',
        { className: 'flex-none mb2' },
        'p-value cutoff'
      ),
      h(
        'div',
        { className: 'flex-none mb2' },
        h('input', {
          className: 'field',
          style: { width: '100%' },
          type: 'number',
          value: pValueThreshhold.toFixed(2),
          onKeyDown: e => e.preventDefault(),
          onChange: e => {
            setBrushedGenes(Immutable.OrderedSet())
            setPValueThreshhold(parseFloat(e.target.value))
          },
          min: '0',
          max: '1',
          step: '.01' })
      ),
      h(
        'div',
        { className: 'flex-grow relative' },
        h(
          'div',
          { style: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } },
          h(
            'div',
            { style: {
                position: 'absolute',
                height: '100%',
                left: 18,
                right: 0,
              } },
            histogram && histogram.reverse().map((ct, i) => h('span', {
              key: `${cellA}${cellB}-${i}`,
              title: (1 - i / 100).toFixed(2),
              className: 'PValueBar inline-block absolute border-box',
              onClick: e => {
                setBrushedGenes(Immutable.OrderedSet())
                setPValueThreshhold(1 - i / 100)
              },
              style: {
                height: '1%',
                top: `${i}%`,
                width: `${scale(ct)}%`,
                opacity: 100 - i <= pValueThreshhold * 100 ? 1 : .33,
              } }))
          ),
          h('input', {
            ref: 'range',
            type: 'range',
            orient: 'vertical',
            value: pValueThreshhold,
            style: {
              width: 18,
              height: '100%',
            },
            onChange: e => {
              setBrushedGenes(Immutable.OrderedSet())
              setPValueThreshhold(parseFloat(e.target.value))
            },
            min: '0',
            max: '1',
            step: '.01' })
        )
      )
    )
  },
})
