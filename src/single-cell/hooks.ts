import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux'

import {
  SingleCellStoreDispatch,
  SingleCellStoreState
} from './store'

export const useViewDispatch = () => useDispatch<SingleCellStoreDispatch>()

export const useViewSelector: TypedUseSelectorHook<SingleCellStoreState> = useSelector

export function useView() {
  return useViewSelector(state => state)
}
