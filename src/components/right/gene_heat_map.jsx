"use strict";

var d3 = require('d3')
  , React = require('react')
  , Immutable = require('immutable')
  , embryos = require('../../embryos.json')
  , cellNameMap = require('../../cell_name_map.json')


module.exports = React.createClass({
  displayName: 'GeneHeatMap',

  propTypes: {
    focusedGene: React.PropTypes.instanceOf(Immutable.Map),
    cellGeneExpressionData: React.PropTypes.object
  },

  getMeasures() {
    var { focusedGene, cellGeneExpressionData } = this.props
      , ret = {}

    Object.keys(cellGeneExpressionData).forEach(cell => {
      ret[cell] = cellGeneExpressionData[cell][focusedGene.get('geneName')];
    });

    return ret;
  },

  render () {
    var { focusedGene, height } = this.props
      , Embryo = require('../embryo.jsx')
      , measures = this.getMeasures()
      , squareHeight = ((height - 28) / 5) - 2
      , scale
      , step

    scale = d3.scale.linear()
      .domain([0, d3.max(Object.keys(measures).map(d => measures[d].avg))])
      .range(['#fff', '#2566a8'])
      .nice(4)

    step = d3.max(scale.domain()) / 4

    return (
      <div>
        <h4 className="m0 mb1"> {/* height is 28px */}
          { focusedGene.get('geneName') }
          {' ('}
          <a
              target="_blank"
              href={`http://www.wormbase.org/db/gene/gene?name=${focusedGene.get('geneName')}`}>
            WormBase
          </a>
          {')'}
        </h4>
        <div className="flex">
          <div className="flex-none">
            {
              [0, 1, 2, 3, 4].map(i =>
                <div className="relative" style={{
                  height: squareHeight,
                  width: 120,
                  lineHeight: squareHeight + 'px'
                }}>
                  <span
                      key={`${focusedGene.get('geneName')}-scale-${i}`}
                      style={{
                        position: 'absolute',
                        backgroundColor: scale(i * step),
                        width: squareHeight,
                        height: squareHeight,
                      }}> </span>
                  <span style={{ marginLeft: squareHeight + 2 }}>
                    { i * step }
                  </span>
                </div>
              )
            }
          </div>
          {
            embryos.map((embryoData, i) =>
              <div className="flex-auto px1" key={`${focusedGene.get('geneName')}-embryo-${i}`}>
                <Embryo
                  embryoData={embryoData}
                  extraCellAtrs={cellName => ({
                    className: undefined,
                    onClick: undefined,
                    stroke: '#999',
                    fill: scale(measures[cellNameMap[cellName]].avg),
                  })}
                  {...this.props} />
              </div>
            )
          }
        </div>
      </div>
    )
  }

});
