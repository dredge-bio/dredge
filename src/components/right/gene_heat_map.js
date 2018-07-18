"use strict"

const h = require('react-hyperscript')
    , d3 = require('d3')
    , React = require('react')
    , Immutable = require('immutable')
    , embryos = require('../../embryos.json')
    , cellNameMap = require('../../cell_name_map.json')
    , Embryo = require('../embryo')

module.exports = React.createClass({
  displayName: 'GeneHeatMap',

  propTypes: {
    focusedGene: React.PropTypes.instanceOf(Immutable.Map),
    cellGeneExpressionData: React.PropTypes.object,
  },

  getMeasures() {
    const { focusedGene, cellGeneExpressionData } = this.props,
        ret = {}

    Object.keys(cellGeneExpressionData).forEach(cell => {
      ret[cell] = cellGeneExpressionData[cell][focusedGene.get('geneName')]
    })

    return ret
  },

  render() {
    const { focusedGene, height } = this.props
        , measures = this.getMeasures()
        , squareHeight = (height - 28) / 5 - 2

    const scale = d3.scale.linear().domain([0, d3.max(Object.keys(measures).map(d => measures[d].avg))]).range(['#fff', '#2566a8']).nice(4)

    const step = d3.max(scale.domain()) / 4

    return h(
      'div',
      null,
      h(
        'h4',
        { className: 'm0 mb1' },
        ' ',
        focusedGene.get('geneName'),
        ' (',
        h(
          'a',
          {
            target: '_blank',
            href: `http://www.wormbase.org/db/gene/gene?name=${focusedGene.get('geneName')}` },
          'WormBase'
        ),
        ')'
      ),
      h(
        'div',
        { className: 'flex' },
        h(
          'div',
          { className: 'flex-none' },
          [0, 1, 2, 3, 4].map(i => h(
            'div',
            { className: 'relative', style: {
                height: squareHeight,
                width: 120,
                lineHeight: squareHeight + 'px',
              } },
            h(
              'span',
              {
                key: `${focusedGene.get('geneName')}-scale-${i}`,
                style: {
                  position: 'absolute',
                  backgroundColor: scale(i * step),
                  width: squareHeight,
                  height: squareHeight,
                } },
              ' '
            ),
            h(
              'span',
              { style: { marginLeft: squareHeight + 2 } },
              i * step
            )
          ))
        ),
        embryos.map((embryoData, i) => h(
          'div',
          { className: 'flex-auto px1', key: `${focusedGene.get('geneName')}-embryo-${i}` },
          h(Embryo, Object.assign({
            embryoData,
            extraCellAtrs: cellName => ({
              className: undefined,
              onClick: undefined,
              stroke: 'black',
              fill: scale(measures[cellNameMap[cellName]].avg),
            }),
          }, this.props))
        ))
      )
    )
  },

})
