"use strict"

const h = require('react-hyperscript')
    , GeneTable = require('./table/component')
    , GeneHeatMap = require('./gene_heat_map')
    , Actions = require('./actions')

const ACTION_HEIGHT = 80,
      HEATMAP_HEIGHT = 180

const RightPanel = props => {
  const tableHeight = props.height - ACTION_HEIGHT - HEATMAP_HEIGHT

  let width = props.rightPanelWidth

  width -= 20

  return h(
    'section',
    { style: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: props.leftPanelWidth,
        paddingRight: 20,
        width,
      } },
    h(
      'div',
      { style: { height: ACTION_HEIGHT } },
      props.pairwiseComparisonData && props.cellGeneExpressionData && h(Actions, Object.assign({}, props, {
        height: ACTION_HEIGHT,
        width }))
    ),
    h(
      'div',
      { style: { height: tableHeight } },
      props.pairwiseComparisonData && props.cellGeneExpressionData && h(GeneTable, Object.assign({}, props, {
        height: tableHeight,
        width }))
    ),
    h(
      'div',
      { style: {
          height: HEATMAP_HEIGHT - 16,
          marginTop: '16px',
          overflow: 'hidden',
        } },
      props.cellGeneExpressionData && props.focusedGene && h(GeneHeatMap, Object.assign({}, props, {
        height: HEATMAP_HEIGHT - 16,
        width }))
    )
  )
}

module.exports = RightPanel
