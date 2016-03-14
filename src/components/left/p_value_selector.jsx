"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , d3 = require('d3')


module.exports = React.createClass({
  displayName: 'PValueSelector',

  propTypes: {
    setPValueThreshhold: React.PropTypes.func.isRequired,
    data: React.PropTypes.instanceOf(Immutable.Map)
  },

  componentDidMount() {
    this.refs.range.setAttribute('orient', 'vertical');
  },

  render: function () {
    var { cellA, cellB, pValueThreshhold, setPValueThreshhold, pairwiseComparisonData } = this.props
      , histogram
      , scale

      // this STARTS at .00
    if (pairwiseComparisonData) {
      histogram = d3.layout.histogram().bins(100).value(d => d.pValue)
      histogram = histogram(pairwiseComparisonData.toArray());
      histogram = histogram.map(d => d.length);

      scale = d3.scale.linear()
        .domain([0, d3.max(histogram)])
        .range([0, 100])
    }

    return (
      <div className="flex flex-column">
        <div className="flex-none mb2">
        p-value cutoff
        </div>
        <div className="flex-none mb2">
          <input
              className="field"
              type="number"
              value={pValueThreshhold.toFixed(2)}
              onKeyDown={e => e.preventDefault()}
              onChange={e => setPValueThreshhold(parseFloat(e.target.value))}
              min="0"
              max="1"
              step=".01" />
        </div>
        <div className="flex-grow" style={{ width: 100, position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}>
            <div style={{ borderLeft: '1px solid black' }}>
              {
                histogram && histogram.reverse().map((ct, i) =>
                  <span
                      key={`${cellA}${cellB}-${i}`}
                      className="inline-block absolute"
                      style={{
                        height: '1%',
                        top: `${i}%`,
                        left: 12,
                        width: `${scale(ct)}%`,
                        background: 'maroon',
                        opacity: (100 - i) <= pValueThreshhold * 100 ? 1 : .33
                      }} />
                )
              }
            </div>
            <input
                ref="range"
                type="range"
                orient="vertical"
                value={pValueThreshhold}
                style={{
                  width: 0,
                  height: '100%',
                  zIndex: 10
                }}
                onChange={e => setPValueThreshhold(parseFloat(e.target.value))}
                min="0"
                max="1"
                step=".01" />
          </div>
        </div>
      </div>
    )
  }
});
