"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Action = require('../../actions')

const HeatMapContainer = styled.div`
  flex-grow: 1;

  position: relative;

  & svg {
    position: absolute;
    height: 100%;
    margin: auto;
    top: 0;
    bottom: 0;
  }

  & rect {
    stroke: black;
  }
`

const SQUARE_WIDTH = 20

function HeatMap({
  dispatch,
  grid,
  gene,
  rpkmsForTreatmentGene,
  treatments,
  comparedTreatments,
  hoveredTreatment,
}) {
  let squares = null
    , xScale = null
    , yScale = null

  if (grid && gene && rpkmsForTreatmentGene) {
    const rpkms = grid.map(row =>
      row.map(treatment =>
        treatment && d3.mean(rpkmsForTreatmentGene(treatment, gene))))

    const maxRPKM = R.reduce(R.max, 1, R.flatten(rpkms).filter(R.identity))

    const colorScale = d3.scaleSequential(d3.interpolateOranges)
      .domain([0, maxRPKM])

    xScale = d3.scaleLinear()
      .domain([0, grid[0].length - 1])
      .range([0, SQUARE_WIDTH * (grid[0].length - 1)])

    yScale = d3.scaleLinear()
      .domain([0, grid.length - 1])
      .range([0, SQUARE_WIDTH * (grid.length - 1)])

    squares = R.pipe(
      grid => grid.map((row, i) =>
        row.map((treatment, j) => treatment && {
          treatment,
          attrs: {
            fill: colorScale(rpkms[i][j]),
            x: xScale(j),
            y: yScale(i),
            height: SQUARE_WIDTH,
            width: SQUARE_WIDTH,
          },
        })
      ),
      R.chain(R.filter(R.identity))
    )(grid)
  }

  return (
    h('div', {
      style: {
        fontFamily: 'SourceSansPro',
        fontSize: 18,
        padding: '10px 0',
        display: 'flex',
        flexDirection: 'column',
      },
    }, [
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
        },
      }, [
        h('h2', {
          style: {
            marginBottom: 5,
          },
        }, gene),

        hoveredTreatment && treatments[hoveredTreatment].label,
      ]),
      squares && h(HeatMapContainer, [
        h('svg', {
          viewBox: `0 0 ${xScale.range()[1] + SQUARE_WIDTH + 2} ${yScale.range()[1] + SQUARE_WIDTH + 2}`,
          preserveAspectRatio: 'xMinYMid meet',
          style: {
            maxHeight: (yScale.domain()[1] + 1) * SQUARE_WIDTH,
          },
        }, [
          h('g', {
            transform: 'translate(1,1)',
          }, squares.map(square =>
            h('rect', Object.assign({}, square.attrs, {
              // title: treatments[square.treatment].label,
              onClick: e => {
                const newComparedTreatments = e.shiftKey
                  ? [comparedTreatments[0], square.treatment]
                  : [square.treatment, comparedTreatments[1]]

                dispatch(Action.SetPairwiseComparison(...newComparedTreatments))
              },
              onMouseEnter: () => {
                dispatch(Action.SetHoveredTreatment(square.treatment))
              },
              onMouseLeave: () => {
                dispatch(Action.SetHoveredTreatment(null))
              },
            }))
          )),
        ]),
      ]),
    ])
  )
}


module.exports = connect(R.applySpec({
  comparedTreatments: R.path(['currentView', 'comparedTreatments']),
  hoveredTreatment: R.path(['currentView', 'hoveredTreatment']),
  grid: R.path(['currentView', 'project', 'grid']),
  gene: R.path(['currentView', 'focusedGene']),
  rpkmsForTreatmentGene: R.path(['currentView', 'project', 'rpkmsForTreatmentGene']),
  treatments: R.path(['currentView', 'project', 'treatments']),
}))(HeatMap)

