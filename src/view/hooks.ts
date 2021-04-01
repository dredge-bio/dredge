import * as React from 'react'
import { unwrapResult } from '@reduxjs/toolkit'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setPairwiseComparison } from './actions'
import { useProject } from '../projects'

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
            pairwiseData: result.pairwiseData,
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

export function useView() {
  const view = useAppSelector(state => state.view && state.view.default)

  if (view === null) {
    throw new Error('No view is loaded')
  }

  return view
}

export function useViewProject() {
  const view = useView()

  return useProject(view.source, true)
}
