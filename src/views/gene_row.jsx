"use strict";

var React = require('react')

function GeneRow({ geneName, plotData, renderFirstColumn }) {
  var geneData = plotData.get(geneName)

  if (!geneData) {
    return (
      <tr>
      { renderFirstColumn && <td>{ renderFirstColumn(geneName) }</td> }
        <td>{ geneName }</td>
        <td colSpan={3} className="muted">
          <em>No measurement</em>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      { renderFirstColumn && <td>{ renderFirstColumn(geneName) }</td> }
      <td>{ geneName }</td>
      <td>
        { geneData.pValue.toFixed(3) }
      </td>
      <td>
        { geneData.logCPM.toFixed(2) }
      </td>
      <td>
        { geneData.logFC.toFixed(2) }
      </td>
    </tr>
  )
}

function GeneTable({ plotData, geneNames, renderFirstColumn }) {
  return (
    <div style={{ height: '500px', maxHeight: '500px', overflowY: 'scroll' }}>
      <table>
        <thead>
          <tr>
            <th />
            <th>gene</th>
            <th>p</th>
            <th>log CPM</th>
            <th>log FC</th>
          </tr>
        </thead>
        <tbody>
        {
          geneNames.map(geneName =>
            <GeneRow
                key={geneName}
                geneName={geneName}
                plotData={plotData}
                renderFirstColumn={renderFirstColumn} />
            )
        }
        </tbody>
      </table>
    </div>
  )
}

module.exports = GeneTable;
