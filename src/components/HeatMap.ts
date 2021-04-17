import h from 'react-hyperscript'
import styled from 'styled-components'
import * as d3 from 'd3'
import * as R from 'ramda'

import { useView, useViewProject } from '../view'
import { useAbundances } from '../projects'

const SQUARE_WIDTH = 20

const HeatMapContainer = styled.svg`
  max-height: 100%;
  margin: auto;

  .heatmap-square {
    stroke: black;
  }
`

type HeatMapProps = {
  transcript: string | null;
}

export default function HeatMap(props: HeatMapProps) {
  const view = useView()
      , project = useViewProject()
      , { hoveredTreatment } = view
      , { transcript } = props
      , { grid, treatments } = project.data

  const {
    abundancesForTreatmentTranscript,
    colorScaleForTranscript,
  } = useAbundances(view.source)

  if (!grid) return null
  if (!grid.length) return null
  if (!transcript) return null

  const abundances = grid.map(row =>
    row.map(treatment =>
      treatment && d3.mean(
        abundancesForTreatmentTranscript(treatment, transcript) || [0]) || 0))

  const colorScale = colorScaleForTranscript(transcript)


  const xScale = d3.scaleLinear()
    .domain([0, grid[0]!.length - 1])
    .range([0, SQUARE_WIDTH * (grid[0]!.length - 1)])

  const yScale = d3.scaleLinear()
    .domain([0, grid.length - 1])
    .range([0, SQUARE_WIDTH * (grid.length - 1)])

  const squares = grid
    .map((row, i) =>
      row.map((treatment, j) => !treatment ? null : {
        treatment,
        attrs: {
          fill: colorScale(abundances[i]![j] || 0),
          x: xScale(j),
          y: yScale(i),
          height: SQUARE_WIDTH,
          width: SQUARE_WIDTH,
        },
      })
    )
    .flat()
    .filter(R.identity)

  return (
    h(HeatMapContainer, {
      viewBox: `0 0 ${xScale.range()[1]! + SQUARE_WIDTH + 8} ${yScale.range()[1]! + SQUARE_WIDTH + 8}`,
      preserveAspectRatio: 'xMinYMid meet',
      style: {
        height: (yScale.domain()[1]! + 1) * SQUARE_WIDTH,
      },
    }, [
      h('g', {
        transform: 'translate(4,4)',
      }, [

        h('g', squares.map(square =>
          h('rect.heatmap-square', square!.attrs)
        )),

        h('g', squares.map(square =>
          h('rect', Object.assign({}, square!.attrs, {
            ['data-treatment']: square!.treatment,
            fill: 'transparent',
            transform: 'translate(0, 0)',
            stroke: square!.treatment === hoveredTreatment ? 'blue' : 'none',
            strokeWidth: square!.treatment === hoveredTreatment ? 5 : 0,
            // onClick: this.selectTreatment,
            // onMouseEnter: this.setHoveredTreatment,
            // onMouseLeave: this.clearHoveredTreatment,
          }), [
            h('title', treatments.get(square!.treatment)?.label),
          ])
        )),

      ]),
    ])
  )

}

/*

class HeatMap extends React.Component {
  constructor() {
    super()

    this.selectTreatment = this.selectTreatment.bind(this)
    this.setHoveredTreatment = this.setHoveredTreatment.bind(this)
    this.clearHoveredTreatment = this.clearHoveredTreatment.bind(this)
  }

  selectTreatment(e) {
    const { updateOpts, comparedTreatments } = this.props
        , selectedTreatment = e.target.dataset.treatment

    const [ treatmentA, treatmentB ] = e.shiftKey
      ? [comparedTreatments[0], selectedTreatment]
      : [selectedTreatment, comparedTreatments[1]]

    updateOpts(opts => Object.assign({}, opts, {
      treatmentA,
      treatmentB,
    }))
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

}
*/
