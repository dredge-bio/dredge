import * as R from 'ramda'

export function getDefaultGrid(treatments: string[]) {
  const numTreatments = treatments.length
      , numRows = Math.floor(numTreatments / (numTreatments / 5) - .00000000001) + 1
      , numPerRow = Math.ceil(numTreatments / numRows)

  return R.splitEvery(numPerRow, treatments)
}
