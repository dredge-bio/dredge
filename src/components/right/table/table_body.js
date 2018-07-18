"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')

function dashesOrFixed(number, places = 2) {
  return number == null ? '--' : number.toFixed(places)
}

function p(e) {
  e.preventDefault()
  e.stopPropagation()
}

function GeneRow({
  saved,
  geneData,
  pValueThreshhold,
  savedGenes,
  savedGeneNames,
  focusedGene,
  setSavedGenes,
  setFocusedGene,
  setHoveredGene,
}) {
  const geneName = geneData.get('geneName')
      , data = geneData.toJS()

  let className = "GeneRow"
    , firstColumn

  if (focusedGene && focusedGene.get('geneName') === data.geneName) {
    className += ' GeneRow--selected'
  }

  if (geneData.get('pValue') == null || geneData.get('pValue') > pValueThreshhold) {
    className += ' gray'
  }

  if (saved) {
    firstColumn = h(
      'a',
      { className: 'red', href: '',
        onClick: e => {
          p(e);setSavedGenes(savedGeneNames.remove(geneName))
        } },
      'x'
    )
  } else if (!saved && !savedGenes.has(geneData)) {
    firstColumn = h(
      'a',
      { href: '',
        onClick: e => {
          p(e);setSavedGenes(savedGeneNames.add(geneName))
        } },
      '<'
    )
  }

  const tdStyle = {
    padding: '2px 0',
  }

  return h(
    'tr',
    {
      className,
      onMouseEnter: () => setHoveredGene(geneData),
      onMouseLeave: () => setHoveredGene(null),
      onClick: () => setFocusedGene(geneData, !saved) },
    h(
      'td',
      { className: 'center', style: tdStyle },
      firstColumn
    ),
    h(
      'td',
      { style: tdStyle },
      geneName
    ),
    h(
      'td',
      { style: tdStyle },
      dashesOrFixed(data.pValue, 3)
    ),
    h(
      'td',
      { style: tdStyle },
      dashesOrFixed(data.logCPM)
    ),
    h(
      'td',
      { style: tdStyle },
      dashesOrFixed(data.logFC)
    ),
    h(
      'td',
      { style: tdStyle },
      dashesOrFixed(data.cellARPKMAvg)
    ),
    h(
      'td',
      { style: tdStyle },
      dashesOrFixed(data.cellARPKMMed)
    ),
    h(
      'td',
      { style: tdStyle },
      dashesOrFixed(data.cellBRPKMAvg)
    ),
    h(
      'td',
      { style: tdStyle },
      dashesOrFixed(data.cellBRPKMMed)
    )
  )
}

const GeneTable = props => h(
  'tbody',
  null,
  !props.brushedGenes.size && props.savedGenes.map(geneData => h(GeneRow, Object.assign({
    key: 'saved' + geneData.get('geneName'),
    saved: true,
    geneData,
  }, props))),
  props.brushedGenes.map(geneData => h(GeneRow, Object.assign({
    key: 'brushed' + geneData.get('geneName'),
    saved: false,
    geneData,
  }, props)))
)

GeneTable.propTypes = {
  savedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
  brushedGenes: React.PropTypes.instanceOf(Immutable.OrderedSet).isRequired,
  cellGeneExpressionData: React.PropTypes.object.isRequired,
  setSavedGenes: React.PropTypes.func.isRequired,
  setFocusedGene: React.PropTypes.func.isRequired,
}

module.exports = GeneTable
