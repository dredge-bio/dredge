"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default

function Left({ width, height }) {
  return (
    h(styled.div`
      position: absolute;
      top: 0;
      left: 0;
      height: ${height}px;
      width: ${width}px;
      background-color: lightblue;
    `, [
    ])
  )
}

module.exports = Left
