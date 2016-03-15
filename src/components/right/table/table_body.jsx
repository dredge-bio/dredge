"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , GeneTable


function dashesOrFixed(number, places=2) {
  return number == null ? '--' : number.toFixed(places)
}

function p(e) {
  e.preventDefault();
  e.stopPropagation();
}

function GeneRow({
  saved,
  geneData,
  savedGenes,
  savedGeneNames,
  focusedGene,
  setSavedGenes,
  setFocusedGene,
  setHoveredGene
}) {
  var geneName = geneData.get('geneName')
    , className = "GeneRow"
    , data = geneData.toJS()
    , firstColumn

  if (focusedGene && focusedGene.get('geneName') === data.geneName) {
    className += ' GeneRow--selected';
  }

  if (saved) {
    firstColumn = (
      <a className="red" href=""
         onClick={e => { p(e); setSavedGenes(savedGeneNames.remove(geneName)) }}>
        x
      </a>
    )
  } else if (!saved && !savedGenes.has(geneData)) {
    firstColumn = (
      <a href=""
         onClick={e => { p(e); setSavedGenes(savedGeneNames.add(geneName)) }}>
        {'<'}
      </a>
    )
  }


  return (
    <tr
        className={className}
        onMouseEnter={() => setHoveredGene(geneData)}
        onMouseLeave={() => setHoveredGene(null)}
        onClick={() => setFocusedGene(geneData, !saved)}>
      <td>{ firstColumn }</td>
      <td>{ geneName }</td>
      <td>{ dashesOrFixed(data.pValue, 3) }</td>
      <td>{ dashesOrFixed(data.logCPM) }</td>
      <td>{ dashesOrFixed(data.logFC) }</td>
      <td>{ dashesOrFixed(data.cellARPKMAvg) }</td>
      <td>{ dashesOrFixed(data.cellARPKMMed) }</td>
      <td>{ dashesOrFixed(data.cellBRPKMAvg) }</td>
      <td>{ dashesOrFixed(data.cellBRPKMMed) }</td>
    </tr>
  )
}

GeneTable = props => (
  <tbody>
    {
      props.savedGenes.map(geneData =>
        <GeneRow
            key={'saved' + geneData.get('geneName')}
            saved={true}
            geneData={geneData}
            {...props} />
      )
    }

    {
      props.brushedGenes.map(geneData =>
        <GeneRow
            key={'brushed' + geneData.get('geneName')}
            saved={false}
            geneData={geneData}
            {...props} />
      )
    }
  </tbody>
)

GeneTable.propTypes = {
  savedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
  brushedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
  cellGeneExpressionData: React.PropTypes.object.isRequired,
  setSavedGenes: React.PropTypes.func.isRequired,
  setFocusedGene: React.PropTypes.func.isRequired,
}

module.exports = GeneTable;
