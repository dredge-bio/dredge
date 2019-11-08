"use strict";

module.exports = {
  label: {
    name: 'label',
    label: 'Project name',
    required: true,
  },

  expressionMatrix: {
    name: 'expressionMatrix',
    label: 'Expression matrix file',
    required: true,
  },

  treatments: {
    name: 'treatments',
    label: 'Treatments description file',
    required: true,
  },

  pairwiseName: {
    name: 'pairwiseName',
    label: 'Pairwise comparison file template',
    required: true,
  },

  maPlot: {
    name: 'maPlot',
    label: 'MA plot limits',
  },

  transcriptAliases: {
    name: 'transcriptAliases',
    label: 'Transcript aliases file',
  },

  readme: {
    name: 'readme',
    label: 'Project documentation file',
  },

  transcriptHyperlink: {
    name: 'transcriptHyperlink',
    label: 'Transcript hyperlink template',
  },

  diagram: {
    name: 'diagram',
    label: 'Diagram file',
  },

  grid: {
    name: 'grid',
    label: 'Grid file',
  },

  heatmapMinimumMaximum: {
    name: 'heatmapMinimumMaximum',
    label: 'Minimum heatmap abundance range',
  },
}
