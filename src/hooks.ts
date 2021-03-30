import { TypedUseSelectorHook, useSelector } from 'react-redux'

import { useAppDispatch } from './store'
import { DredgeState } from './types'

export const useAppSelector: TypedUseSelectorHook<DredgeState> = useSelector
export { useAppDispatch }
