"use strict"

// 3 decimal places for pValue, 1 for others

const h = require('react-hyperscript')
    , React = require('react')
    , LeftPanel = require('./left/component')
    , RightPanel = require('./right/component')

const MIN_RIGHT_WIDTH = 666
    , MAX_RIGHT_WIDTH = 780
    , MIN_LEFT_WIDTH = 614
    , MIN_HEIGHT = 600

function Loading() {
  return h('div', {
    style: {
      color: 'crimson',
      fontSize: '48px',
      position: 'absolute',
      top: 150,
      left: 16,
    },
  }, 'Loading...')
}

module.exports = React.createClass({
  displayName: 'Display',

  getInitialState() {
    return {
      leftPanelWidth: null,
      rightPanelWidth: null,
      height: null,
      pValueThreshhold: 1,
      hoveredGene: null,
      focusedGene: null,
      focusedGeneInBrushed: false,
    }
  },

  componentDidMount() {
    let leftPanelWidth = window.innerWidth * .42
      , rightPanelWidth = window.innerWidth * .58
      , height = document.getElementById('application').clientHeight

    if (leftPanelWidth < MIN_LEFT_WIDTH) leftPanelWidth = MIN_LEFT_WIDTH
    if (rightPanelWidth < MIN_RIGHT_WIDTH) rightPanelWidth = MIN_RIGHT_WIDTH

    if (rightPanelWidth > MAX_RIGHT_WIDTH) {
      rightPanelWidth = MAX_RIGHT_WIDTH
      leftPanelWidth = window.innerWidth - rightPanelWidth
    }

    if (height < MIN_HEIGHT) height = MIN_HEIGHT

    leftPanelWidth -= 40

    this.setState({ leftPanelWidth, rightPanelWidth, height })

    window.addEventListener('keydown', e => {
      switch (e.code) {
        case "ArrowDown":
          e.preventDefault()
          this.focusNextGene()
          break
        case "ArrowUp":
          e.preventDefault()
          this.focusPreviousGene()
          break
        case "Space":
          const { savedGenes, setSavedGenes } = this.props
              , { focusedGene } = this.state

          e.preventDefault()

          if (savedGenes.contains(focusedGene)) {
            setSavedGenes(savedGenes.remove(focusedGene).map(gene => gene.get('geneName')))
          } else {
            setSavedGenes(savedGenes.add(focusedGene).map(gene => gene.get('geneName')))
          }
      }
    })
  },

  componentWillReceiveProps(nextProps) {
    const { savedGenes } = this.props
        , { focusedGene } = this.state

    if (!nextProps.brushedGenes || !nextProps.savedGenes) return

    if (nextProps.brushedGenes.size) {
      this.setState({
        focusedGene: nextProps.brushedGenes.first(),
        focusedGeneInBrushed: true,
      })
    } else if (!savedGenes || !savedGenes.equals(nextProps.savedGenes)) {
      if (focusedGene) {
        const prevFocusedName = focusedGene.get('geneName')

        const newFocusedGene = nextProps.savedGenes.find(gene => gene.get('geneName') === prevFocusedName)

        this.setState({
          focusedGene: newFocusedGene || nextProps.savedGenes.first(),
          focusedGeneInBrushed: false,
        })
      } else {
        this.setState({
          focusedGene: nextProps.savedGenes.first(),
          focusedGeneInBrushed: false,
        })
      }
    } else if (!nextProps.savedGenes.contains(focusedGene)) {
      this.setState({
        focusedGene: nextProps.savedGenes.first(),
        focusedGeneInBrushed: false,
      })
    } else {
      this.setState({ focusedGeneInBrushed: false })
    }
  },

  focusNextGene() {
    let { savedGenes, brushedGenes } = this.props

    const { focusedGene, focusedGeneInBrushed } = this.state

    savedGenes = savedGenes.toList()
    brushedGenes = brushedGenes.toList()

    if (!focusedGene) {
      if (brushedGenes.size) {
        this.setFocusedGene(brushedGenes.first(), true)
      } else {
        this.setFocusedGene(savedGenes.first())
      }
    } else if (focusedGeneInBrushed) {
      const idx = brushedGenes.indexOf(focusedGene)

      if (idx + 1 !== brushedGenes.size) {
        this.setFocusedGene(brushedGenes.get(idx + 1), true)
      }
    } else {
      const idx = savedGenes.indexOf(focusedGene)

      if (idx + 1 !== savedGenes.size) {
        this.setFocusedGene(savedGenes.get(idx + 1))
      }
    }
  },

  focusPreviousGene() {
    let { savedGenes, brushedGenes } = this.props

    const { focusedGene, focusedGeneInBrushed } = this.state

    savedGenes = savedGenes.toList()
    brushedGenes = brushedGenes.toList()

    if (!focusedGene) {
      this.focusNextGene()
    } else if (focusedGeneInBrushed) {
      const idx = brushedGenes.indexOf(focusedGene)

      if (idx !== 0) {
        this.setFocusedGene(brushedGenes.get(idx - 1), true)
      }
    } else {
      const idx = savedGenes.indexOf(focusedGene)

      if (idx > 0) {
        this.setFocusedGene(savedGenes.get(idx - 1))
      }
    }
  },

  setFocusedGene(focusedGene, focusedGeneInBrushed = false) {
    this.setState({ focusedGene, focusedGeneInBrushed })
  },

  setHoveredGene(hoveredGene) {
    this.setState({ hoveredGene })
  },

  setPValueThreshhold(pValueThreshhold) {
    this.setState({ pValueThreshhold })
  },

  render() {
    const { loading, initializing } = this.props
        , { leftPanelWidth, rightPanelWidth } = this.state

    return h('div', [
      leftPanelWidth && h(LeftPanel, Object.assign({}, this.props, this.state, {
        setPValueThreshhold: this.setPValueThreshhold,
      })),

      rightPanelWidth && h(RightPanel, Object.assign({}, this.props, this.state, {
        setFocusedGene: this.setFocusedGene,
        setHoveredGene: this.setHoveredGene,
      })),

      (loading || initializing) && h(Loading, null),
    ])
  },
})
