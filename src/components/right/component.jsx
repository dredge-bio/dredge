"use strict";

var React = require('react')
  , GeneTable = require('./table/component.jsx')
  , GeneHeatMap = require('./gene_heat_map.jsx')
  , Actions = require('./actions.jsx')
  , RightPanel

RightPanel = props => (
  <section className="flex flex-column" style={{
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%'
  }}>
    <div className="flex-none px2 py1">
      {
        props.pairwiseComparisonData &&
        props.cellGeneExpressionData &&
        <Actions {...props} />
      }
    </div>

    <div className="flex-auto flex flex-stretch">
      {
        props.pairwiseComparisonData &&
        props.cellGeneExpressionData &&
        <GeneTable {...props} />
      }
    </div>

    <div className="flex-none" style={{ height: 200 }}>
      {
        props.cellGeneExpressionData &&
        props.focusedGene &&
        <GeneHeatMap {...props} />
      }
    </div>
  </section>
)

module.exports = RightPanel;
