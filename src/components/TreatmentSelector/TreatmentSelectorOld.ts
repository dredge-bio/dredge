"use strict";

import h from 'react-hyperscript'
import * as R from 'ramda'
import * as d3 from 'd3'
import * as React from 'react'
import styled from 'styled-components'
import { connect, ConnectedProps } from 'react-redux'

/*
import { setHoveredTreatment } from '../actions'
*/

import { projectForView } from '../utils'
import { DredgeState, TreatmentName, TranscriptName } from '../types'

const connector = connect(mapStateToProps)

type TooltipPosition = 'bottom' | 'top'

type Props = ConnectedProps<typeof connector> & {
  useSelectBackup: boolean;
  selectedTreatment: TreatmentName | null;
  onSelectTreatment: (treatment: TreatmentName, shiftPressed?: boolean) => void;
  loading: boolean;
  tooltipPos: TooltipPosition;
  transcript?: TranscriptName;
  paintHovered: boolean;
}

type State = {
  _hoveredTreatment: TreatmentName | null;
}

class TreatmentSelector extends React.Component<Props, State> {
  public svgEl: null | HTMLDivElement

  constructor(props: Props) {
    super(props)

    this.state = {
      _hoveredTreatment: null,
    }

    this.svgEl = null;

    this.handleSVGClick = this.handleSVGClick.bind(this)
    this.handleTreatmentEnter = this.handleTreatmentEnter.bind(this)
    this.handleTreatmentLeave = this.handleTreatmentLeave.bind(this)

  }

  componentDidMount() {
    if (this.props.transcript) {
      this.paintTreatments()
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { svg } = this.props

    if (!svg) return null

    if (this.props.transcript !== prevProps.transcript) {
      this.paintTreatments()
    }

    if (this.props.paintHovered && this.props.hoveredTreatment !== prevProps.hoveredTreatment) {
      this.paintHoveredTreatment()
    }
  }

  paintTreatments() {
    const {
      transcript,
      treatments,
      abundancesForTreatmentTranscript,
      colorScaleForTranscript,
    } = this.props

    const treatmentEls = R.zip(
      Object.keys(treatments),
      Object.keys(treatments).map((treatment: TreatmentName): Element | null => {
        if (!this.svgEl) return null

        return this.svgEl.querySelector(`[data-treatment="${treatment}"]`)
      }))

    treatmentEls.forEach(([, el]) => {
      if (el === null) return
      (el as HTMLDivElement).style.fill = '';
    })

    if (!transcript) return

    const colorScale = colorScaleForTranscript(transcript)

    treatmentEls.forEach(([ treatment, treatmentEl ]) => {
      const abundances = abundancesForTreatmentTranscript(treatment, transcript)

      let abundanceMean: number

      if (abundances === null) {
        abundanceMean = 0
      } else {
        abundanceMean = d3.mean(abundances) || 0
      }

      (treatmentEl as HTMLDivElement).style.fill = colorScale(abundanceMean)
    })
  }

  paintHoveredTreatment() {
    const { hoveredTreatment } = this.props

    if (!hoveredTreatment || !this.svgEl) return

    Array.from(this.svgEl.querySelectorAll('[data-treatment]')).forEach(el => {
      el.classList.remove('active')
    })

    const el = this.svgEl.querySelector(`[data-treatment="${hoveredTreatment}"]`)

    if (!el) return

    el.classList.add('active')
  }
}
