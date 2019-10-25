"use strict";

module.exports = {
  label: {
    name: 'label',
    label: 'Project name',
    required: true,
  },

  baseURL: {
    name: 'baseURL',
    label: 'Configuration file directory',
    required: true,
  },

  expressionMatrix: {
    name: 'expressionMatrix',
    label: 'Gene expression matrix URL',
    required: true,
  },

  treatments: {
    name: 'treatments',
    label: 'Treatment information URL',
    required: true,
  },

  pairwiseName: {
    name: 'pairwiseName',
    label: 'Pairwise comparison URL template',
    required: true,
  },

  maPlot: {
    name: 'maPlot',
    label: 'MA plot limits',
  },

  transcriptAliases: {
    name: 'transcriptAliases',
    label: 'Transcript aliases URL',
  },

  readme: {
    name: 'readme',
    label: 'Project documentation',
  },

  transcriptHyperlink: {
    name: 'transcriptHyperlink',
    label: 'Transcript hyperlink template',
  },

  diagram: {
    name: 'diagram',
    label: 'Diagram URL',
  },

  grid: {
    name: 'grid',
    label: 'Grid URL',
  },

  heatmapMinimumMaximum: {
    name: 'heatmapMinimumMaximum',
    label: 'Minimum heatmap abundance',
  },
}
