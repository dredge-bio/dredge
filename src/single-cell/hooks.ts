import * as React from 'react'

import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux'
import { makeUseViewOptions } from '@dredge/shared'

import {
  SingleCellStoreDispatch,
  SingleCellStoreState
} from './store'

import SingleCellExpression from './expressions'
import { optionsCodec } from './options'

const { useMemo } = React


export { useTranscripts } from '@dredge/shared'

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

export const useViewOptions = makeUseViewOptions(optionsCodec)
