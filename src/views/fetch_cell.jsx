"use strict";

/* eslint no-alert:0 */

var React = require('react')
  , Immutable = require('immutable')


function cellFile(cellName, cellMap) {
  return cellMap[cellName] || cellName;
}


module.exports = function (Component) {
  var CellFetch = React.createClass({
    getInitialState() {
      return {
        cellA: 'EMS',
        cellB: 'C',
        fetchingCells: null,
        plotData: null,
        loading: false
      }
    },

    componentDidMount() {
      setTimeout(this.fetchCellPairData, 0);
    },

    setCurrentCell(cellType, cell) {
      if (cellType === 'A') {
        this.fetchCellPairData(cell);
      } else if (cellType === 'B') {
        this.fetchCellPairData(null, cell);
      }
    },

    onResponse(e) {
      this.setState({ loading: false });

      if (e instanceof Error) {
        throw e;
      } else {
        return e;
      }
    },

    fetchCellPairData(a, b) {
      var cellNameMap = require('../cell_name_map.json')
        , { cellA, cellB } = this.state
        , cellFileA
        , cellFileB
        , dataFile

      if (a) {
        cellA = a;
      } else if (b) {
        cellB = b;
      }

      this.setState({ fetchingCells: cellA + cellB })

      cellFileA = cellFile(cellA, cellNameMap);
      cellFileB = cellFile(cellB, cellNameMap);

      this.setState({ loading: true });

      dataFile = `data/geneExpression/${cellFileA}_${cellFileB}.txt`

      fetch(dataFile)
        .then(null, this.onResponse)
        .then(response => {
          var { fetchingCells } = this.state

          // Stop if cells have been changed since fetch started
          if (fetchingCells !== (cellA + cellB)) return;

          // TODO: make sure of 200
          response
            .text()
            .then(this.processPlotData)
            .then(plotData => {
              setTimeout(() => this.setState({ loading: false }), 300);
              this.setState({
                cellA, cellB, plotData
              })
            });
        })
        .catch(() => alert('SOPHIE IT\'S AN ERROR IM SORRY'))
    },

    processPlotData(text) {
      return Immutable.Map().withMutations(plotData => {
        text.split('\n').slice(1).map(row => row.split('\t'))
          .forEach(([geneName, logFC, logCPM, pValue]) => {
            plotData.set(geneName, {
              geneName,
              logFC: parseFloat(logFC),
              logCPM: parseFloat(logCPM),
              pValue: parseFloat(pValue)
            })
          })
      });
    },

    render() {
      return (
        <Component
            {...this.props}
            {...this.state}
            setCurrentCell={this.setCurrentCell} />
      )
    }
  });

  return CellFetch
}
