"use strict";

const h = require('react-hyperscript')
    , styled = require('styled-components').default
    , Table = require('./Table')
    , WatchedGenes = require('./WatchedGenes')

const ComparisonContainer = styled.div`
  display: grid;
  grid-template-rows: auto 72% 1fr;
  height: 100%;
  margin-right: 2em;
`

module.exports = function ComparisonInformation() {
  return h(ComparisonContainer, [
    h(WatchedGenes),
    h(Table),
    h('div'),
  ])
}
