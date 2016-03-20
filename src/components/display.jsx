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

const MIN_RIGHT_WIDTH = 666
    , MAX_RIGHT_WIDTH = 780
    , MIN_LEFT_WIDTH = 614
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

    if (rightPanelWidth > MAX_RIGHT_WIDTH) {
      rightPanelWidth = MAX_RIGHT_WIDTH;
      leftPanelWidth = window.innerWidth - rightPanelWidth;
    }

    if (height < MIN_HEIGHT) height = MIN_HEIGHT;

    leftPanelWidth -= 40;

    this.setState({ leftPanelWidth, rightPanelWidth, height });

    window.addEventListener('keydown', e => {
      switch(e.code) {
      case "ArrowDown":
        e.preventDefault();
        this.focusNextGene();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.focusPreviousGene();
        break;
      case "Space":
        let { savedGenes, setSavedGenes } = this.props
          , { focusedGene } = this.state

        e.preventDefault();

        if (savedGenes.contains(focusedGene)) {
          setSavedGenes(savedGenes.remove(focusedGene).map(gene => gene.get('geneName')));
        } else {
          setSavedGenes(savedGenes.add(focusedGene).map(gene => gene.get('geneName')));
        }
      }
    });
  },

  componentWillReceiveProps(nextProps) {
    var { savedGenes, brushedGenes } = this.props
      , { focusedGene } = this.state

    if (!nextProps.brushedGenes || !nextProps.savedGenes) return;

    if (nextProps.brushedGenes.size) {
      this.setState({
        focusedGene: nextProps.brushedGenes.first(),
        focusedGeneInBrushed: true
      });
    } else if (!savedGenes || !savedGenes.equals(nextProps.savedGenes)) {
      if (focusedGene) {
        let prevFocusedName = focusedGene.get('geneName')
          , newFocusedGene

        newFocusedGene = nextProps.savedGenes
          .find(gene => gene.get('geneName') === prevFocusedName)

        this.setState({
          focusedGene: newFocusedGene || nextProps.savedGenes.first(),
          focusedGeneInBrushed: false
        });
      } else {
        this.setState({
          focusedGene: nextProps.savedGenes.first(),
          focusedGeneInBrushed: false
        });
      }
    } else if (!nextProps.savedGenes.contains(focusedGene)) {
        this.setState({
          focusedGene: nextProps.savedGenes.first(),
          focusedGeneInBrushed: false
        });
    } else {
      this.setState({ focusedGeneInBrushed: false });
    }
  },

  focusNextGene() {
    var { savedGenes, brushedGenes } = this.props
      , { focusedGene, focusedGeneInBrushed } = this.state

    savedGenes = savedGenes.toList();
    brushedGenes = brushedGenes.toList();

    if (!focusedGene) {
      if (brushedGenes.size) {
        this.setFocusedGene(brushedGenes.first(), true);
      } else {
        this.setFocusedGene(savedGenes.first());
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
