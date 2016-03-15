"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , CellSelector = require('./cell_selector.jsx')
  , CellPlot = require('./plot.jsx')
  , CellPValueSelector = require('./p_value_selector.jsx')
  , LeftPanel


const SELECTOR_HEIGHT = 120
    , PVALUE_SELECTOR_WIDTH = 100

LeftPanel = props => {
  var width = props.leftPanelWidth
    , plotHeight = props.height - 2 * SELECTOR_HEIGHT;

  return (
    <section style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width
    }}>
      <div style={{ height: SELECTOR_HEIGHT }}>
        <CellSelector
            currentCell={props.cellA}
            labelOrientation="bottom"
            onSelectCell={props.setCurrentCell.bind(null, 'A')} />
      </div>

      <div style={{ height: plotHeight }}>
        <CellPlot
            {...props}
            height={plotHeight}
            width={width - PVALUE_SELECTOR_WIDTH} />
        <CellPValueSelector
            {...props}
            height={plotHeight}
            width={PVALUE_SELECTOR_WIDTH} />
      </div>

      <div style={{ height: SELECTOR_HEIGHT }}>
        <CellSelector
          currentCell={props.cellB}
            labelOrientation="top"
          onSelectCell={props.setCurrentCell.bind(null, 'B')} />
      </div>
    </section>
  )
}


LeftPanel.propTypes = {
  cellA: React.PropTypes.string.isRequired,
  cellB: React.PropTypes.string.isRequired,
  pairwiseComparisonData: React.PropTypes.instanceOf(Immutable.Map),
  setCurrentCell: React.PropTypes.func.isRequired,
  setPValueThreshhold: React.PropTypes.func.isRequired
}


module.exports = LeftPanel;
