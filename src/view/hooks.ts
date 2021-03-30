import * as React from 'react'
import { useAppDispatch } from '../hooks'

const { useEffect, useState } = React

type ComparedTreatments = [
  treatmentA: string,
  treatmentB: string,
]

type TreatmentState =
  {
    loading: true;
    treatmentA: string;
    treatmentB: string;
  } | 
  {
    loading: false;
    treatmentA: string;
    treatmentB: string;
  }

export function useTreatments(compared: ComparedTreatments) {
  const [ treatmentA, treatmentB ] = compared
      , dispatch = useAppDispatch

  const [{ loading }, setState] = useState({
    loading: true,
  })

  useEffect(() => {
    //dispatch()
  }, [ treatmentA, treatmentB ])

  return {
    loading,
    treatmentA,
    treatmentB,
  }
}
