"use strict";

const h = require('react-hyperscript')

function MagnifyingGlass({
  stroke='black',
  strokeWidth=2,
  height=16,
  width=16,
}) {
  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 24 24',
      stroke,
      strokeWidth,
      fill: 'none',
    }, [
      h('circle', {
        cx: 9,
        cy: 9,
        r: 8,
      }),
      h('line', {
        x1: 23,
        y1: 23,
        x2: 14.65,
        y2: 14.65,
      }),
    ])
  )
}

function Target ({
  stroke='black',
  strokeWidth=2,
  height=16,
  width=16,
}) {
  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 24 24',
      stroke,
      strokeWidth,
      fill: 'none',
    }, [
      h('line', {
        x1: 12,
        y1: 1,
        x2: 12,
        y2: 8,
      }),

      h('line', {
        x1: 12,
        y1: 16,
        x2: 12,
        y2: 23,
      }),

      h('line', {
        x1: 1,
        y1: 12,
        x2: 8,
        y2: 12,
      }),

      h('line', {
        x1: 16,
        y1: 12,
        x2: 23,
        y2: 12,
      }),

    ])
  )
}

function Reset({
  stroke='black',
  strokeWidth=2,
  height=16,
  width=16,
}) {
  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 24 24',
      stroke,
      strokeWidth,
      fill: 'none',
    }, [
      h('path', {
        d: 'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38',
      }),
    ])
  )
}

module.exports = {
  MagnifyingGlass,
  Target,
  Reset,
}
