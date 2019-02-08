"use strict";

const h = require('react-hyperscript')
    , d3 = require('d3')
    , R = require('ramda')
    , React = require('react')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default
    , Action = require('../actions')

const COLOR_SCALE = d3.interpolateOranges
    , SQUARE_WIDTH = 20

const HeatMapContainer = styled.svg`
  max-height: 100%;

  .heatmap-square {
    stroke: black;
  }
`


class HeatMap extends React.Component {
  constructor() {
    super()

    this.selectTreatment = this.selectTreatment.bind(this)
    this.setHoveredTreatment = this.setHoveredTreatment.bind(this)
    this.clearHoveredTreatment = this.clearHoveredTreatment.bind(this)
  }

  selectTreatment(e) {
    const { dispatch, comparedTreatments } = this.props
        , selectedTreatment = e.target.dataset.treatment

    const newComparedTreatments = e.shiftKey
      ? [comparedTreatments[0], selectedTreatment]
      : [selectedTreatment, comparedTreatments[1]]

    dispatch(Action.SetPairwiseComparison(...newComparedTreatments))
  }

  setHoveredTreatment(e) {
    const { dispatch } = this.props
        , selectedTreatment = e.target.dataset.treatment

    dispatch(Action.SetHoveredTreatment(selectedTreatment))
  }

  clearHoveredTreatment() {
    const { dispatch } = this.props

    dispatch(Action.SetHoveredTreatment(null))
  }

  render() {
    const { grid, transcript, abundancesForTreatmentTranscript, treatments, hoveredTreatment } = this.props

    if (!grid) return null

    if (!transcript) return null

    const abundances = grid.map(row =>
      row.map(treatment =>
        treatment && d3.mean(abundancesForTreatmentTranscript(treatment, transcript))))

    const maxAbundance = R.reduce(R.max, 1, R.flatten(abundances).filter(R.identity))

    const colorScale = d3.scaleSequential(COLOR_SCALE)
      .domain([0, maxAbundance])

    const xScale = d3.scaleLinear()
      .domain([0, grid[0].length - 1])
      .range([0, SQUARE_WIDTH * (grid[0].length - 1)])

    const yScale = d3.scaleLinear()
      .domain([0, grid.length - 1])
      .range([0, SQUARE_WIDTH * (grid.length - 1)])

    const squares = R.pipe(
      grid => grid.map((row, i) =>
        row.map((treatment, j) => treatment && {
          treatment,
          attrs: {
            fill: colorScale(abundances[i][j]),
            x: xScale(j),
            y: yScale(i),
            height: SQUARE_WIDTH,
            width: SQUARE_WIDTH,
          },
        })
      ),
      R.chain(R.filter(R.identity))
    )(grid)

    return (
      h(HeatMapContainer, {
        viewBox: `0 0 ${xScale.range()[1] + SQUARE_WIDTH + 8} ${yScale.range()[1] + SQUARE_WIDTH + 8}`,
        preserveAspectRatio: 'xMinYMid meet',
        style: {
          height: (yScale.domain()[1] + 1) * SQUARE_WIDTH,
        },
      }, [
        h('g', {
          transform: 'translate(4,4)',
        }, [

          h('g', squares.map(square =>
            h('rect.heatmap-square', square.attrs),
          )),

          h('g', squares.map(square =>
            h('rect', Object.assign({}, square.attrs, {
              ['data-treatment']: square.treatment,
              fill: 'transparent',
              transform: 'translate(0, 0)',
              stroke: square.treatment === hoveredTreatment ? 'blue' : 'none',
              strokeWidth: square.treatment === hoveredTreatment ? 5 : 0,
              onClick: this.selectTreatment,
              onMouseEnter: this.setHoveredTreatment,
              onMouseLeave: this.clearHoveredTreatment,
            }), [
              h('title', treatments[square.treatment].label),
            ])
          )),

        ]),
      ])
    )
  }
}

module.exports = connect(R.applySpec({
  comparedTreatments: R.path(['currentView', 'comparedTreatments']),
  hoveredTreatment: R.path(['currentView', 'hoveredTreatment']),
  grid: R.path(['currentView', 'project', 'grid']),
  transcript: R.either(
    R.path(['currentView', 'hoveredTranscript']),
    R.path(['currentView', 'focusedTranscript'])
  ),
  abundancesForTreatmentTranscript: R.path(['currentView', 'project', 'abundancesForTreatmentTranscript']),
  treatments: R.path(['currentView', 'project', 'treatments']),
}))(HeatMap)
