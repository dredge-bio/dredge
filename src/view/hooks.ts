import * as React from 'react'
import { unwrapResult } from '@reduxjs/toolkit'
import { useAppDispatch } from '../hooks'
import { setPairwiseComparison } from './actions'

import { PairwiseComparison } from '../types'

const { useEffect, useState } = React

type ComparedTreatments = [
  treatmentA: string,
  treatmentB: string,
]

type TreatmentState =
  {
    loading: true;
    pairwiseData: null,
    error: null,
  } | 
  {
    loading: false;
    pairwiseData: null,
    error: string,
  } |
  {
    loading: false,
    pairwiseData: PairwiseComparison,
    error: null
  }

export function useTreatments(compared: ComparedTreatments) {
  const [ treatmentA, treatmentB ] = compared
      , dispatch = useAppDispatch()

  const [{
    loading,
    pairwiseData,
    error,
  }, setState] = useState<TreatmentState>({
    loading: true,
    pairwiseData: null,
    error: null,
  })

  useEffect(() => {
    let canceled = false

    async function fetchComparison() {
      try {
        const result = unwrapResult(await dispatch(setPairwiseComparison({
          treatmentAKey: treatmentA,
          treatmentBKey: treatmentB,
        })))

        if (!canceled) {
          setState({
            loading: false,
            error: null,
            pairwiseData: result.pairwiseData
          })
        }
      } catch (e) {
        if (!canceled) {
          setState({
            loading: false,
            error: e.message,
            pairwiseData: null,
          })
        }
      }
    }

    fetchComparison()

    return () => {
      canceled = true
    }
  }, [ treatmentA, treatmentB ])

  return {
    loading,
    treatmentA,
    treatmentB,
  }
}
