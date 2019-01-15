"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , HeatMap = require('./HeatMap')
    , TreatmentSelector = require('./TreatmentSelector')
    , Action = require('../actions')

const InfoBoxContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  position: relative;

  & > :nth-child(1) {
    padding-top: .5rem;
    display: flex;
    justify-content: space-between;
  }

  & > :nth-child(2) {
    flex-grow: 1;
    position: relative;
    height: 100%;

    padding: .66rem 0;

    display: flex;
    align-items: center;
  }
`

function ColorLegend({ gene, colorScale }) {
  return (
    h('div', {
      style: {
        minWidth: 100,
        padding: '.66rem 1rem',
        background: '#fafafa',
        border: '1px solid #ccc',
        borderRadius: 4,
        marginRight: '2rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
      },
    }, [
      h('h4', {
        key: 'title',
        style: {
          marginBottom: 6,
          fontFamily: 'SourceSansPro',
        },
      }, 'Abundance'),
    ].concat(colorScale.ticks(4).map((abundance, i) =>
      h('div', {
        key: `${gene}-${i}`,
        style: {
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          marginTop: -1,
        },
      }, [
        h('span', {
          style: {
            fontFamily: 'SourceSansPro',
            alignSelf: 'stretch',
            backgroundColor: colorScale(abundance),
            width: 20,
            marginRight: 4,
            border: '1px solid black',
          },
        }),

        h('span', {
          style: {
            fontSize: 12,
          },
        }, abundance),
      ])
    )))
  )
}

class InfoBox extends React.Component {
  constructor() {
    super()

    this.state = {
      hovered: false,
    }

    this.handleSelectTreatment = this.handleSelectTreatment.bind(this)
  }

  componentDidMount() {
    this.el.addEventListener('mouseenter', () => {
      this.setState({ hovered: true })
    })

    this.el.addEventListener('mouseleave', () => {
      this.setState({ hovered: false })
    })
  }

  handleSelectTreatment(selectedTreatment, shiftKey) {
      const { dispatch, comparedTreatments } = this.props

      const newComparedTreatments = shiftKey
        ? [comparedTreatments[0], selectedTreatment]
        : [selectedTreatment, comparedTreatments[1]]

      dispatch(Action.SetPairwiseComparison(...newComparedTreatments))
  }

  render() {
    const {
      focusedGene,
      hoveredGene,
      treatments,
      comparedTreatments,
      abundancesForTreatmentGene,
    } = this.props

    const { hovered } = this.state

    const gene = hoveredGene || focusedGene || null

    let colorScale

    if (gene && abundancesForTreatmentGene) {
      const abundances = R.chain(R.pipe(
        treatment => abundancesForTreatmentGene(treatment, gene),
        d3.mean
      ))(Object.keys(treatments))

      const maxAbundance = R.reduce(R.max, 1, abundances)

      colorScale = d3.scaleSequential(d3.interpolateOranges)
        .domain([0, maxAbundance])
    }

    return (
      h(InfoBoxContainer, [
        h('div', [
          gene && h('h3', gene),
          h('div', {
            style: {
              fontSize: 12,
              color: '#666',
              position: 'absolute',
              right: '33%',
              bottom: '-.33em',
            },
          }, gene && hovered && [
            'Click a treatment to set top of comparison. Shift+Click to set bottom.',
          ]),
        ]),

        h('div', {
          ref: el => { this.el = el },
        }, comparedTreatments && [
          colorScale && h(ColorLegend, { colorScale }),

          h(HeatMap),

          h('div', {
            style: {
              alignSelf: 'stretch',
              position: 'relative',
              marginLeft: '2rem',
              flexGrow: 1,
            },
          }, [
            gene && h(TreatmentSelector, {
              gene,
              paintHovered: true,
              tooltipPos: 'top',
              heatmap: true,
              onSelectTreatment: this.handleSelectTreatment,
            }),
          ]),
        ]),
      ])
    )
  }
}

module.exports = connect(R.applySpec({
  comparedTreatments: R.path(['currentView', 'comparedTreatments']),
  hoveredTreatment: R.path(['currentView', 'hoveredTreatment']),
  focusedGene: R.path(['currentView', 'focusedGene']),
  hoveredGene: R.path(['currentView', 'hoveredGene']),
  treatments: R.path(['currentView', 'project', 'treatments']),
  abundancesForTreatmentGene: R.path(['currentView', 'project', 'abundancesForTreatmentGene']),
}))(InfoBox)

