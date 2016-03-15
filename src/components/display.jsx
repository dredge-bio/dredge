"use strict";

// 3 decimal places for pValue, 1 for others

var React = require('react')

function Loading() {
  return <div style={{
    color: 'crimson',
    fontSize: '48px',
    position: 'absolute',
    top: 150,
    left: 16
  }}>Loading...</div>
}

const MIN_LEFT_WIDTH = 400
    , MIN_RIGHT_WIDTH = 600
    , MIN_HEIGHT = 600


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
    var leftPanelWidth = window.innerWidth * .42
      , rightPanelWidth = window.innerWidth * .58
      , height = document.getElementById('application').clientHeight

    if (leftPanelWidth < MIN_LEFT_WIDTH) leftPanelWidth = MIN_LEFT_WIDTH;
    if (rightPanelWidth < MIN_RIGHT_WIDTH) rightPanelWidth = MIN_RIGHT_WIDTH;
    if (height < MIN_HEIGHT) height = MIN_HEIGHT;

    leftPanelWidth -= 40;

    this.setState({ leftPanelWidth, rightPanelWidth, height });

    window.addEventListener('keydown', e => {
      switch(e.code) {
      case "KeyJ":
        this.focusNextGene();
        break;
      case "KeyK":
        this.focusPreviousGene();
        break;
      }
    });
  },

  focusNextGene() {
    var { savedGenes, brushedGenes } = this.props
      , { focusedGene, focusedGeneInBrushed } = this.state

    savedGenes = savedGenes.toList();
    brushedGenes = brushedGenes.toList();

    if (!focusedGene) {
      if (savedGenes.size) {
        this.setFocusedGene(savedGenes.first());
      } else if (brushedGenes.size) {
        this.setFocusedGene(brushedGenes.first(), true);
      }
    } else if (focusedGeneInBrushed) {
      let idx = brushedGenes.indexOf(focusedGene);

      if (idx + 1 !== brushedGenes.size) {
        this.setFocusedGene(brushedGenes.get(idx + 1), true);
      }
    } else {
      let idx = savedGenes.indexOf(focusedGene);

      if (idx + 1 !== savedGenes.size) {
        this.setFocusedGene(savedGenes.get(idx + 1));
      } else if (brushedGenes.size) {
        this.setFocusedGene(brushedGenes.first(), true);
      }
    }
  },

  focusPreviousGene() {
    var { savedGenes, brushedGenes } = this.props
      , { focusedGene, focusedGeneInBrushed } = this.state

    savedGenes = savedGenes.toList();
    brushedGenes = brushedGenes.toList();

    if (!focusedGene) {
      this.focusNextGene();
    } else if (focusedGeneInBrushed) {
      let idx = brushedGenes.indexOf(focusedGene);

      if (idx !== 0) {
        this.setFocusedGene(brushedGenes.get(idx - 1), true);
      } else if (savedGenes.size) {
        this.setFocusedGene(savedGenes.last());
      }

    } else {
      let idx = savedGenes.indexOf(focusedGene);

      if (idx > 0) {
        this.setFocusedGene(savedGenes.get(idx - 1));
      }
    }
  },

  setFocusedGene(focusedGene, focusedGeneInBrushed=false) {
    this.setState({ focusedGene, focusedGeneInBrushed });
  },

  setHoveredGene(hoveredGene) {
    this.setState({ hoveredGene });
  },

  setPValueThreshhold(pValueThreshhold) {
    this.setState({ pValueThreshhold });
  },

  render: function () {
    var LeftPanel = require('./left/component.jsx')
      , RightPanel = require('./right/component.jsx')
      , { loading, initializing } = this.props
      , { leftPanelWidth, rightPanelWidth } = this.state

    return (
      <div>
        {
          leftPanelWidth && (
            <LeftPanel
                {...this.props}
                {...this.state}
                setPValueThreshhold={this.setPValueThreshhold} />
          )
        }

        {
          rightPanelWidth && (
            <RightPanel
                {...this.props}
                {...this.state}
                setFocusedGene={this.setFocusedGene}
                setHoveredGene={this.setHoveredGene} />
          )
        }

        { (loading || initializing) && <Loading /> }
      </div>
    )
  }
});
