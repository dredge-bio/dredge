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

    display: grid;
    grid-template-columns: ${props => props.showSVG
      ? 'auto auto 1fr'
      : 'auto 1fr'
    }

    align-items: stretch;
  }
`

function ColorLegend({ transcript, colorScale }) {
  const gradients = colorScale.ticks(10).map(x => colorScale(x)).join(', ')
      , ticks = colorScale.nice().domain()

  ticks.splice(1, 0, (ticks[0] + ticks[1]) / 2)

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
          marginBottom: 9,
          fontFamily: 'SourceSansPro',
        },
      }, 'Abundance'),
      h('div', {
        style: {
          display: 'flex',
          flexGrow: 1,
          position: 'relative',
        },
      }, [
        h('div', {
          style: {
            width: 20,
            background: `linear-gradient(${gradients})`,
            border: '1px solid #666',
          },
        }),

        h('div', {
          style: {
            paddingLeft: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          },
        }, ticks.map((val, i) =>
          h('div', {
            key: `${i}-${val}`
          }, d3.format(',')(val))
        ))
      ])
    ])
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
      svg,
      getCanonicalTranscriptLabel,
      focusedTranscript,
      hoveredTranscript,
      treatments,
      comparedTreatments,
      colorScaleForTranscript,
      updateOpts,
      transcriptHyperlink,
      heatmapMinimumMaximum,
    } = this.props

    const { hovered } = this.state

    const transcript = hoveredTranscript || focusedTranscript || null
        , transcriptLabel = transcript && getCanonicalTranscriptLabel(transcript)
        , showSVG = !!svg

    let colorScale

    if (transcript) {
      colorScale = colorScaleForTranscript(transcript)
    }

    return (
      h(InfoBoxContainer, {
        showSVG,
      }, [
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
              color: '#333',
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

          !showSVG ? null : h('div', {
            style: {
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
      'colorScaleForTranscript',
      'getCanonicalTranscriptLabel',
      'svg',
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
