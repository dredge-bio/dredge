"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , HeatMap = require('./HeatMap')
    , TreatmentSelector = require('./TreatmentSelector')

const InfoBoxContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;

  & > :nth-child(1) {
    padding-top: .5rem;
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
      }, 'RPKMS'),
    ].concat(colorScale.ticks(4).map((rpkm, i) =>
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
            backgroundColor: colorScale(rpkm),
            width: 20,
            marginRight: 4,
            border: '1px solid black',
          },
        }),

        h('span', {
          style: {
            fontSize: 12,
          },
        }, rpkm),
      ])
    )))
  )
}

function InfoBox({
  focusedGene,
  hoveredGene,
  treatments,
  comparedTreatments,
  rpkmsForTreatmentGene,
}) {
  const gene = hoveredGene || focusedGene || null

  let colorScale

  if (gene && rpkmsForTreatmentGene) {
    const rpkms = R.chain(R.pipe(
      treatment => rpkmsForTreatmentGene(treatment, gene),
      d3.mean
    ))(Object.keys(treatments))

    const maxRPKM = R.reduce(R.max, 1, rpkms)

    colorScale = d3.scaleSequential(d3.interpolateOranges)
      .domain([0, maxRPKM])
  }

  return (
    h(InfoBoxContainer, [
      h('div', [
        gene && h('h3', gene),
      ]),

      h('div', comparedTreatments && [
        colorScale && h(ColorLegend, { colorScale }),

        h(HeatMap),

        h('div', {
          style: {
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
            onSelectTreatment(treatment) {
              console.log(treatment)
            },
          }),
        ]),
      ]),
    ])
  )
}

module.exports = connect(R.applySpec({
  comparedTreatments: R.path(['currentView', 'comparedTreatments']),
  focusedGene: R.path(['currentView', 'focusedGene']),
  hoveredGene: R.path(['currentView', 'hoveredGene']),
  treatments: R.path(['currentView', 'project', 'treatments']),
  rpkmsForTreatmentGene: R.path(['currentView', 'project', 'rpkmsForTreatmentGene']),
}))(InfoBox)

