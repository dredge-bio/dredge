import * as React from 'react'

import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux'

import {
  SingleCellStoreDispatch,
  SingleCellStoreState
} from './store'

import SingleCellExpression from './expressions'

const { useMemo } = React


export const useViewDispatch = () => useDispatch<SingleCellStoreDispatch>()

export const useViewSelector: TypedUseSelectorHook<SingleCellStoreState> = useSelector

export function useView() {
  return useViewSelector(state => state)
}

export function useSeuratDataset() {
  const { project } = useView()

  const scDataset = useMemo(
    () => new SingleCellExpression(project.data),
    [ project ])

  return scDataset
}
