"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , d3 = require('d3')
    , React = require('react')
    , styled = require('styled-components').default
    , { connect } = require('react-redux')
    , Action = require('../actions')

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

const Tooltip = styled.div`
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

class TreatmentSelector extends React.Component {
  constructor() {
    super()

    this.state = {
      _hoveredTreatment: null,
    }

    this.handleSVGClick = this.handleSVGClick.bind(this)
    this.handleTreatmentEnter = this.handleTreatmentEnter.bind(this)
    this.handleTreatmentLeave = this.handleTreatmentLeave.bind(this)

  }

  componentDidMount() {
    const { svg } = this.props

    if (!svg) return null

    this.svgEl.innerHTML = svg;
    this.svgEl.addEventListener('click', this.handleSVGClick)

    ;[...this.svgEl.querySelectorAll('[data-treatment]')].forEach(el => {
      el.addEventListener('mouseenter', this.handleTreatmentEnter)
      el.addEventListener('mouseleave', this.handleTreatmentLeave)
    })

    this.updateSelectedTreatment()

    if (this.props.gene) {
      this.paintTreatments()
    }
  }

  componentDidUpdate(prevProps) {
    const { svg } = this.props

    if (!svg) return null

    if (this.props.selectedTreatment !== prevProps.selectedTreatment) {
      this.updateSelectedTreatment()
    }

    if (this.props.gene !== prevProps.gene) {
      this.paintTreatments()
    }

    if (this.props.paintHovered && this.props.hoveredTreatment !== prevProps.hoveredTreatment) {
      this.paintHoveredTreatment()
    }
  }

  updateSelectedTreatment() {
    const { selectedTreatment } = this.props

    ;[...this.svgEl.querySelectorAll('.treatment-selected')].forEach(el => {
      el.classList.remove('treatment-selected')
    })

    const selectedEl = this.svgEl.querySelector(`[data-treatment="${selectedTreatment}"]`)

    if (selectedEl) {
      selectedEl.classList.add('treatment-selected')
    }
  }

  handleSVGClick(e) {
    const { onSelectTreatment } = this.props
        , clickedTreatment = R.path(['target', 'dataset', 'treatment'], e)

    if (clickedTreatment) {
      onSelectTreatment(clickedTreatment, e.shiftKey)
    }
  }

  handleTreatmentEnter(e) {
    const { dispatch } = this.props
        , _hoveredTreatment = R.path(['target', 'dataset', 'treatment'], e)

    this.setState({ _hoveredTreatment })
    dispatch(Action.SetHoveredTreatment(_hoveredTreatment))
  }

  paintTreatments() {
    const { gene, treatments, abundancesForTreatmentGene } = this.props

    const treatmentEls = R.zip(
      Object.keys(treatments),
      Object.keys(treatments).map(
        treatment =>
          this.svgEl.querySelector(`[data-treatment="${treatment}"]`)))

    treatmentEls.forEach(([, el]) => {
      el.style.fill = '';
    })

    if (!gene) return

    const abundances = R.chain(R.pipe(
      R.head,
      treatment => abundancesForTreatmentGene(treatment, gene),
      d3.mean
    ))(treatmentEls)

    const maxAbundance = R.reduce(R.max, 1, abundances)

    const colorScale = d3.scaleSequential(d3.interpolateOranges)
      .domain([0, maxAbundance])

    treatmentEls.forEach(([, el], i) => {
      el.style.fill = colorScale(abundances[i])
    })
  }

  paintHoveredTreatment() {
    const { hoveredTreatment } = this.props

    ;[...this.svgEl.querySelectorAll('[data-treatment]')].forEach(el => {
      el.classList.remove('active')
    })

    if (!hoveredTreatment) return

    const el = this.svgEl.querySelector(`[data-treatment="${hoveredTreatment}"]`)

    if (!el) return

    el.classList.add('active')
  }

  handleTreatmentLeave() {
    const { dispatch } = this.props

    this.setState({ _hoveredTreatment: null })
    dispatch(Action.SetHoveredTreatment(null))
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
            ref: el => { this.svgEl = el },
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
          onChange: e => {
            onSelectTreatment(e.target.value)
          },
        }, (!selectedTreatment ? [h('option', {
          key: '_blank',
          value: '',
        }, 'Initializing...')] : []).concat(_treatments.map(treatment =>
          h('option', {
            key: treatment.key,
            value: treatment.key,
          }, treatment.label),
        ))),
      ])
    )
  }
}

module.exports = connect(R.applySpec({
  svg: R.path(['currentView', 'project', 'svg']),
  treatments: R.path(['currentView', 'project', 'treatments']),
  loading: R.path(['currentView', 'loading']),
  hoveredTreatment: R.path(['currentView', 'hoveredTreatment']),
  abundancesForTreatmentGene: R.path(['currentView', 'project', 'abundancesForTreatmentGene']),
}))(TreatmentSelector)
