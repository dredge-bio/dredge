"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , CellSelector = require('./cell_selector')
    , CellPlot = require('./plot')
    , CellPValueSelector = require('./p_value_selector')

const SELECTOR_HEIGHT = 130,
      PVALUE_SELECTOR_WIDTH = 100

const LeftPanel = props => {
  const plotHeight = props.height - 2 * SELECTOR_HEIGHT

  let width = props.leftPanelWidth

  // Padding
  width -= 40

  return h(
    'section',
    { style: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width,
      } },
    h(
      'div',
      { style: { height: SELECTOR_HEIGHT } },
      h(CellSelector, {
        width,
        currentCell: props.cellA,
        labelOrientation: 'bottom',
        onSelectCell: props.setCurrentCell.bind(null, 'A') })
    ),
    props.brushedGeneNames.size > 0 && h(
      'div',
      { style: { position: 'absolute', top: 160, left: 58 } },
      h(
        'span',
        { className: 'bold' },
        h(
          'span',
          { className: 'purple' },
          props.brushedGeneNames.size
        ),
        ' ',
        props.brushedGeneNames.size > 1 ? 'genes' : 'gene',
        ' selected'
      ),
      h(
        'button',
        { className: 'btn btn-small btn-outline bg-white ml1', onClick: () => props.setBrushedGenes(Immutable.OrderedSet()) },
        'Clear'
      )
    ),
    h(
      'div',
      { style: { height: plotHeight } },
      h(CellPlot, Object.assign({}, props, {
        height: plotHeight - 12,
        width: width - PVALUE_SELECTOR_WIDTH })),
      h(CellPValueSelector, Object.assign({}, props, {
        height: plotHeight,
        width: PVALUE_SELECTOR_WIDTH }))
    ),
    h(
      'div',
      { style: { height: SELECTOR_HEIGHT } },
      h(CellSelector, {
        width,
        currentCell: props.cellB,
        labelOrientation: 'top',
        onSelectCell: props.setCurrentCell.bind(null, 'B') })
    )
  )
}

LeftPanel.propTypes = {
  cellA: React.PropTypes.string.isRequired,
  cellB: React.PropTypes.string.isRequired,
  pairwiseComparisonData: React.PropTypes.instanceOf(Immutable.Map),
  setCurrentCell: React.PropTypes.func.isRequired,
  setPValueThreshhold: React.PropTypes.func.isRequired,
}

module.exports = LeftPanel
