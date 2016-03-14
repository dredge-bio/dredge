"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , CellSelector = require('./cell_selector.jsx')
  , CellPlot = require('./plot.jsx')
  , CellPValueSelector = require('./p_value_selector.jsx')
  , LeftPanel


LeftPanel = props => (
  <section className="flex flex-column" style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%'
  }}>
    <div style={{ height: 120 }}>
      <CellSelector
          currentCell={props.cellA}
          onSelectCell={props.setCurrentCell.bind(null, 'A')} />
    </div>

    <div className="flex-auto flex flex-center flex-stretch">
      <CellPlot {...props} />

      <CellPValueSelector
        onPValueChange={props.setPValueThreshhold}
        data={props.pairwiseComparisonData} />
    </div>

    <div style={{ height: 120 }}>
      <CellSelector
        currentCell={props.cellB}
        onSelectCell={props.setCurrentCell.bind(null, 'B')} />
    </div>
  </section>
)


LeftPanel.propTypes = {
  cellA: React.PropTypes.string.isRequired,
  cellB: React.PropTypes.string.isRequired,
  pairwiseComparisonData: React.PropTypes.instanceOf(Immutable.Map),
  setCurrentCell: React.PropTypes.func.isRequired,
  setPValueThreshhold: React.PropTypes.func.isRequired
}


module.exports = LeftPanel;
