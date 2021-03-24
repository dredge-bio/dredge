"use strict";

import { ConfigDef, Config } from './config'
import * as tPromise from 'io-ts-promise'
import { PathReporter } from 'io-ts/PathReporter'

const OK = {
  label: 'Project label',
  abundanceMeasures: '/path/to/file.txt',
  pairwiseName: '/path/to/%A_%B.txt',
  treatments: '/path/to/treatments.txt',
  abundanceLimits: [
    [0, 100],
    [0, 100],
  ],

  heatmapMinimumMaximum: 0,

}

async function runTest() {
  Object.entries(ConfigDef.props).forEach(([ key, value ]) => {
    console.log(key)
    console.log(value)
  })
  /*
  try {
    const result = await tPromise.decode(ConfigDef, OK)
  } catch (e) {
    console.log(e)
  }
  */
}

runTest()
