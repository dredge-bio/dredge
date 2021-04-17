import h from 'react-hyperscript'
import styled from 'styled-components'
import * as d3 from 'd3'
import * as React from 'react'
import { Flex, Box } from 'rebass'

import { getColorScaleLookup, getTranscriptLookup } from '../projects'
import { useView, useViewProject, useViewOptions } from '../view'

import HeatMap from './HeatMap'
import TreatmentSelector from './TreatmentSelector'

const { useState } = React


const InfoBoxContainer = styled.div<{
  showSVG: boolean
}>`
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

function ColorLegend(props: {
  colorScale: d3.ScaleLinear<number, string>
}) {
  const { colorScale } = props
      , gradients = colorScale.ticks(10).map(x => colorScale(x)).join(', ')
      , ticks = colorScale.nice().domain()

  ticks.splice(1, 0, (ticks[0]! + ticks[1]!) / 2)

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
            key: `${i}-${val}`,
          }, d3.format(',')(val))
        )),
      ]),
    ])
  )
}

export default function InfoBox() {
  const view = useView()
      , project = useViewProject()
      , colorScaleForTranscript = getColorScaleLookup(project)
      , getCanonicalTranscriptLabel = getTranscriptLookup(project)
      , [ , updateOpts ] = useViewOptions()
      , [ , setHovered ] = useState(false)
      , { transcriptHyperlink } = project.config
      , { svg } = project.data

  const transcript = view.hoveredTranscript || view.focusedTranscript || null
      , transcriptLabel = transcript && getCanonicalTranscriptLabel(transcript)
      , showSVG = !!svg

  const colorScale: null | ReturnType<typeof colorScaleForTranscript> =
    transcript === null ? null : colorScaleForTranscript(transcript)

  return (
    h(InfoBoxContainer, { showSVG }, [
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
              href: url.replace('%name', transcriptLabel!),
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
        }, [
          'Click a treatment to set top of comparison. Shift+Click to set bottom.',
        ]),
      ]),

      h('div', {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }, view.comparedTreatments && [
        colorScale && h(ColorLegend, {
          colorScale,
        }),

        h(HeatMap, {
          transcript,
        }),

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
            tooltipPos: 'top' as const,
            heatMap: true,
            onSelectTreatment(treatmentName, shiftKey) {
              if (shiftKey) {
                updateOpts({
                  treatmentB: treatmentName,
                })
              } else {
                updateOpts({
                  treatmentA: treatmentName,
                })
              }
            },
          }),
        ]),
      ]),
    ])
  )
}
