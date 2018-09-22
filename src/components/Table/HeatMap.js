"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')


const HeatMapContainer = styled.div`
  position: relative;
  flex: 1;
`


function HeatMap ({
  grid,
  gene,
  rpkmsForTreatmentGene,
  treatments,
}) {
  if (!grid || !gene || !rpkmsForTreatmentGene) {
    return null
  }

  const rpkms = grid.map(row =>
    row.map(treatment =>
      treatment && d3.mean(rpkmsForTreatmentGene(treatment, gene))))

  const maxRPKM = R.reduce(R.max, 1, R.flatten(rpkms).filter(R.identity))

  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, maxRPKM])

  const xScale = d3.scaleLinear()
    .domain([0, grid[0].length])
    .range([0, 100])

  const yScale = d3.scaleLinear()
    .domain([0, grid.length])
    .range([0, 100])

  const squares = R.pipe(
    grid => grid.map((row, i) =>
      row.map((treatment, j) => treatment && {
        treatment,
        style: {
          background: colorScale(rpkms[i][j]),
          left: `${xScale(j)}%`,
          width: `calc(${xScale(1)}% - 1px)`,
          top: `${yScale(i)}%`,
          height: `${yScale(1)}%`,
        },
      })
    ),
    R.chain(R.filter(R.identity))
  )(grid)

  return (
    h('div', {
      style: {
        padding: '1em 0',
        display: 'flex',
        flexDirection: 'column',
      },
    }, [
      h('h2', gene),
      h(HeatMapContainer, squares.map(square =>
        h('div', {
          title: treatments[square.treatment].label,
          style: Object.assign({
            position: 'absolute',
            border: '1px solid #333',
            boxSizing: 'content-box',
          }, square.style),
        })
      )),
    ])
  )
}


module.exports = connect(R.applySpec({
  grid: R.path(['currentView', 'project', 'grid']),
  gene: R.path(['currentView', 'focusedGene']),
  rpkmsForTreatmentGene: R.path(['currentView', 'project', 'rpkmsForTreatmentGene']),
  treatments: R.path(['currentView', 'project', 'treatments']),
}))(HeatMap)

