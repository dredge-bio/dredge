"use strict";

const test = require('blue-tape')
    , { formatNumber } = require('../src/utils')

const tests = [
  [1, '1'],
  [1.2, '1.2', 'should not convert to fixed for short numbers'],
  [undefined, '--', 'should handle null/undefined'],
  [null, '--'],
  [1.25423, '1.25', 'should round past given number of decimal points'],
  [.0000005, '5e-7', 'should convert to exponential notation'],
  [.001, '1e-3'],
  [-.001, '-1e-3'],
  [-.1, '-0.1'],
]

test('Should format numbers correctly', async t => {
  for (const [ input, expected, message ] of tests) {
    t.equal(formatNumber(input), expected, message)
  }
})
