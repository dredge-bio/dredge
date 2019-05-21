"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , { Flex, Box } = require('rebass')
    , HeatMap = require('./HeatMap')
    , TreatmentSelector = require('./TreatmentSelector')
    , { projectForView } = require('../utils')

const InfoBoxContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  position: relative;

  & > :nth-child(1) {
    padding-top: .5rem;
    display: flex;
    align-items: center;
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

function ColorLegend({ transcript, colorScale }) {
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
        key: `${transcript}-${i}`,
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
    const { updateOpts, comparedTreatments } = this.props

    const [ treatmentA, treatmentB ] = shiftKey
      ? [comparedTreatments[0], selectedTreatment]
      : [selectedTreatment, comparedTreatments[1]]

    updateOpts(opts => Object.assign({}, opts, {
      treatmentA,
      treatmentB,
    }))
  }

  render() {
    const {
      getCanonicalTranscriptLabel,
      focusedTranscript,
      hoveredTranscript,
      treatments,
      comparedTreatments,
      abundancesForTreatmentTranscript,
      updateOpts,
      transcriptHyperlink,
      heatmapMinimumMaximum,
    } = this.props

    const { hovered } = this.state

    const transcript = hoveredTranscript || focusedTranscript || null
        , transcriptLabel = transcript && getCanonicalTranscriptLabel(transcript)

    let colorScale

    if (transcript && abundancesForTreatmentTranscript) {
      const abundances = R.chain(R.pipe(
        treatment => abundancesForTreatmentTranscript(treatment, transcript),
        d3.mean
      ))(Object.keys(treatments))

      let maxAbundance = R.reduce(R.max, 1, abundances)

      // FIXME: This code is duplicated in ./HeatMap.js
      if (maxAbundance < heatmapMinimumMaximum) {
        maxAbundance = heatmapMinimumMaximum
      }

      colorScale = d3.scaleSequential(d3.interpolateOranges)
        .domain([0, maxAbundance])
    }

    return (
      h(InfoBoxContainer, [
        h('div', [
          transcript && h('h3', transcriptLabel),

          transcript && transcriptHyperlink && h(Flex, transcriptHyperlink.map(
            ({ url, label }, i) =>
              h(Box, {
                ml: 2,
                style: {
                  textDecoration: 'none',
                },
                as: 'a',
                target: '_blank',
                href: url.replace('%name', transcriptLabel),
                key: i,
              }, label)
          )),

          h('div', {
            style: {
              fontSize: 12,
              color: '#666',
              position: 'absolute',
              right: '33%',
              bottom: '-.33em',
            },
          }, transcript && hovered && [
            'Click a treatment to set top of comparison. Shift+Click to set bottom.',
          ]),
        ]),

        h('div', {
          ref: el => { this.el = el },
        }, comparedTreatments && [
          colorScale && h(ColorLegend, { colorScale }),

          h(HeatMap, { updateOpts }),

          h('div', {
            style: {
              alignSelf: 'stretch',
              position: 'relative',
              marginLeft: '2rem',
              flexGrow: 1,
            },
          }, [
            transcript && h(TreatmentSelector, {
              transcript,
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

module.exports = connect(state => {
  const project = projectForView(state) || {}

  return Object.assign({},
    R.pick([
      'treatments',
      'abundancesForTreatmentTranscript',
      'getCanonicalTranscriptLabel',
    ], project),
    R.pick([
      'heatmapMinimumMaximum',
      'transcriptHyperlink',
    ], project.config),
    R.pick([
      'comparedTreatments',
      'hoveredTreatment',
      'focusedTranscript',
      'hoveredTranscript',
    ], state.view)
  )
})(InfoBox)
