"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')

module.exports = class NewProject extends React.Component {
  constructor() {
    super();

    this.state = {
      root: '',
      label: '',
      url: '',
      readme: '',
      abundanceLimits: [
        [0, 100],
        [0, 100],
      ],
      treatments: './treatments.json',
      pairwiseName: './pairwise_data/%A_%B.txt',
      transcriptAliases: './aliases.txt',
      abundanceMeasures: './abundanceMeasures.txt',
      diagram: './diagram.svg',
    }
  }

  render() {
    return (
      h('div', [
        'A new project',
      ])
    )
  }
}
