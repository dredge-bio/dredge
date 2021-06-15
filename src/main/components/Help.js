"use strict";

const h = require('react-hyperscript')
    , { Box, Heading } = require('rebass')
    , { Route } = require('org-shell')
    , Link = require('./Link.js')

function Para(props) {
  return h(Box, Object.assign({
    as: 'p',
    mb: 3,
    mt: 2,
  }, props))
}

module.exports = function Help() {
  return (
    h(Box, {
      style: {
        maxWidth: '800px',
        margin: 'auto',
        lineHeight: '20px',
      },
    }, [
      h(Heading, { as: 'h2', mt: 2 }, 'About DrEdGE'),

      h(Para, `
        DrEdGE (Differential Expression Gene Explorer) is an interactive tool for comparing transcript abundance between different treatments in genomic datasets.
      `),

      h(Para, `
        At the center of the tool is an MA plot, which plots genes by their average expression level (x-axis), and by the extent to which transcripts are enriched in one of two treatments being compared (y-axis). The user can select which two treatments t hey wish to compare by clicking on cells or whole embryos above and below the plot.
      `),

      h(Para, `
        Once the MA plot shows a comparison of interest, the user can filter results by significance of differential expression (via the P-value slider to the right). The user can select specific genes by clicking on pixels within the MA plot. When each pixel is clicked, the gene(s) represented by that pixel will show up in the table on the right. The user can add any of these genes to a "watched gene list", which will keep those g enes highlighted in subsequent MA plots. The user can also select large swaths of genes by dragging the mouse over a section of the MA plot.
      `),

      h(Para, `
        The watched gene list can be sorted by a number of features (enrichment in on treatment or the other, average abundance, and others), and can also be exported. To view a summary of gene expression in all treatments through all time points, the user can click on any gene name in the table, and retrieve a pictogram of all stages, with cells colored by quantitative expression data.
      `),

      h('iframe', {
        src: 'https://player.vimeo.com/video/336692274',
        frameBorder: "0",
        width: '100%',
        height: '400',
        allow: 'fullscreen',
        allowFullScreen: true,
        style: {
          border: '2px solid #333',
        },
      }),

      h(Heading, { as: 'h2', mt: 4 }, 'Creating your own project'),

      h(Para, [
        'To create your own DrEdGE project, follow the instructions on ',
        h(Link, {
          route: new Route('configure'),
        }, 'this page'),
        '.',
      ]),

      h(Heading, { as: 'h2', mt: 4 }, 'Attribution'),

      h(Para, 'Designed by Sophia Tintori and Patrick Golden'),

      h(Para, [
        'Coded by Patrick Golden',
        h('br'),
        h('a', {
          href: 'https://github.com/ptgolden/dredge',
        }, 'Source'),
      ]),

      h(Para, [
        'Please cite as:',

        h('br'),

        'Tintori SC, Golden P, Goldstein B. (2020) Differential Expression Gene Explorer (DrEdGE): A tool for generating interactive online data visualizations for statistical exploration of quantitative abundance datasets. ',

        h('i', 'Bioinformatics'),

        ', btz972. ',

        h('a', { href: 'https://doi.org/10.1093/bioinformatics/btz972' }, 'https://doi.org/10.1093/bioinformatics/btz972'),
      ]),
    ])
  )
}
