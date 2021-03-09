"use strict";

import * as h from 'react-hyperscript'
import * as R from 'ramda'
import * as d3 from 'd3'
import * as React from 'react'
import styled from 'styled-components'
import { connect, ConnectedProps } from 'react-redux'

import { setHoveredTreatment } from '../actions'

import { projectForView } from '../utils'
import { DredgeState, DredgeDispatch, ProjectTreatment, TreatmentName, TranscriptName } from '../ts_types'

const connector = connect(mapStateToProps)

type TooltipPosition = 'bottom' | 'top'

type Props = ConnectedProps<typeof connector> & {
  useSelectBackup: boolean;
  selectedTreatment: TreatmentName | null;
  onSelectTreatment: (treatment: TreatmentName, bottom: boolean) => void;
  loading: boolean;
  tooltipPos: TooltipPosition;
  transcript?: TranscriptName;
  paintHovered: boolean;
}

type State = {
  _hoveredTreatment: TreatmentName | null;
}

const SelectorWrapper = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 10px 0;

  & select {
    padding: 1em;
  }

  & svg, & div.svg-wrapper {
    height: 100%;
    width: 100%;
  }

  & div.svg-wrapper {
    position: relative;
  }

  & svg {
    position: absolute;
  }

  & svg path:hover,
  & svg rect:hover {
    fill: #ccc;
    cursor: pointer;
  }

  & svg .treatment-selected {
    fill: lightsteelblue;
  }

  & .active {
    stroke: blue;
    stroke-width: 5px;
  }
`

interface TooltipProps {
  readonly pos: TooltipPosition;
}

const Tooltip = styled.div<TooltipProps>`
  position: absolute;
  z-index: 1;

  left: 0;
  right: 0;
  ${ props => props.pos === 'bottom' ? 'top: 100%;' : 'bottom: 100%;' }

  text-align: center;
  font-weight: bold;

  & span {
    display: inline-block;
    padding: .75rem 1.5rem;

    min-width: 200px;
    background: #fafafa;

    border: 1px solid #ccc;
    borderRadius: 4px;
  }
`

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
    const { svg } = this.props

    if (!svg || !this.svgEl) return null

    this.svgEl.innerHTML = svg;
    this.svgEl.addEventListener('click', this.handleSVGClick)

    Array.from(this.svgEl.querySelectorAll('[data-treatment]')).forEach(el => {
      (el as HTMLDivElement).addEventListener('mouseenter', this.handleTreatmentEnter)
      el.addEventListener('mouseleave', this.handleTreatmentLeave)
    })

    this.updateSelectedTreatment()

    if (this.props.transcript) {
      this.paintTreatments()
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { svg } = this.props

    if (!svg) return null

    if (this.props.selectedTreatment !== prevProps.selectedTreatment) {
      this.updateSelectedTreatment()
    }

    if (this.props.transcript !== prevProps.transcript) {
      this.paintTreatments()
    }

    if (this.props.paintHovered && this.props.hoveredTreatment !== prevProps.hoveredTreatment) {
      this.paintHoveredTreatment()
    }
  }

  updateSelectedTreatment() {
    const { selectedTreatment } = this.props

    if (this.svgEl === null) return

    Array.from(this.svgEl.querySelectorAll('.treatment-selected')).forEach(el => {
      el.classList.remove('treatment-selected')
    })

    const selectedEl = this.svgEl.querySelector(`[data-treatment="${selectedTreatment}"]`)

    if (selectedEl) {
      selectedEl.classList.add('treatment-selected')
    }
  }

  handleSVGClick(e: MouseEvent) {
    const { onSelectTreatment } = this.props
        , clickedTreatment = (e.target as HTMLDivElement).dataset.treatment || null

    if (clickedTreatment) {
      onSelectTreatment(clickedTreatment, e.shiftKey)
    }
  }

  handleTreatmentEnter(e: MouseEvent) {
    const { dispatch } = this.props
        , _hoveredTreatment = (e.target as HTMLDivElement).dataset.treatment || null

    this.setState({ _hoveredTreatment })
    dispatch(setHoveredTreatment(_hoveredTreatment))
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

  handleTreatmentLeave() {
    const { dispatch } = this.props

    this.setState({ _hoveredTreatment: null })
    dispatch(setHoveredTreatment(null))
  }


  render() {
    const {
      svg,
      useSelectBackup,
      treatments,
      selectedTreatment,
      onSelectTreatment,
      loading,
      tooltipPos,
    } = this.props

    const { _hoveredTreatment } = this.state

    const initialLoad = loading && !selectedTreatment

    const _treatments = Object.entries(treatments).map(([key, val]) => ({
      key,
      label: val.label || key,
    }))

    return (
      h(SelectorWrapper, [
        svg == null ? null :h('div.svg-wrapper', [
          h('div', {
            ref: (el: HTMLDivElement) => { this.svgEl = el },
          }),

          tooltipPos && _hoveredTreatment && h(Tooltip, {
            pos: tooltipPos,
          }, [
            h('span', treatments[_hoveredTreatment].label),
          ]),
        ]),

        !(svg == null && useSelectBackup) ? null : h('select', {
          value: selectedTreatment || '',
          disabled: initialLoad,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
            onSelectTreatment(e.target.value, false)
                                                    },
        }, (!selectedTreatment ? [h('option', {
          key: '_blank',
          value: '',
        }, 'Initializing...')] : []).concat(_treatments.map(treatment =>
          h('option', {
            key: treatment.key,
            value: treatment.key,
          }, treatment.label)
        ))),
      ])
    )
  }
}

function mapStateToProps(state: DredgeState) {
  const project = projectForView(state)

  const {
    svg,
    treatments,
    abundancesForTreatmentTranscript,
    colorScaleForTranscript,
  } = project

  const { loading=true, hoveredTreatment=null } = state.view || {}

  return {
    svg,
    treatments,
    abundancesForTreatmentTranscript,
    colorScaleForTranscript,
    loading,
    hoveredTreatment,
  }
}

export default connector(TreatmentSelector)
