"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default

function Right({ left, width, height }) {
  return (
    h(styled.div`
      position: absolute;
      top: 0;
      left: ${left}px;
      height: ${height}px;
      width: ${width}px;
      background-color: lightpink;
    `, [
    ])
  )
}

module.exports = Right
