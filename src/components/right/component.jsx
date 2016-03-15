"use strict";

var React = require('react')
  , GeneTable = require('./table/component.jsx')
  , GeneHeatMap = require('./gene_heat_map.jsx')
  , Actions = require('./actions.jsx')
  , RightPanel

const ACTION_HEIGHT = 80
    , HEATMAP_HEIGHT = 180

RightPanel = props => {
  var width = props.rightPanelWidth
    , tableHeight = props.height - ACTION_HEIGHT - HEATMAP_HEIGHT

  return (
    <section style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      width
    }}>
      <div style={{ height: ACTION_HEIGHT }}>
        {
          props.pairwiseComparisonData &&
          props.cellGeneExpressionData &&
          <Actions
              {...props}
              height={ACTION_HEIGHT}
              width={width} />
        }
      </div>

      <div style={{ height: tableHeight }}>
        {
          props.pairwiseComparisonData &&
          props.cellGeneExpressionData &&
          <GeneTable
              {...props}
              height={tableHeight}
              width={width} />
        }
      </div>

      <div style={{
        height: HEATMAP_HEIGHT - 16,
        marginTop: '16px',
        overflow: 'hidden'
      }}>
        {
          props.cellGeneExpressionData &&
          props.focusedGene &&
          <GeneHeatMap
              {...props}
              height={HEATMAP_HEIGHT - 16}
              width={width} />
        }
      </div>
    </section>
  )
}

module.exports = RightPanel;
