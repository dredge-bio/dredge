import { configureStore } from '@reduxjs/toolkit'
import { SingleCellProject } from '@dredge/main'

import createReducer from './reducer'


export default function createStore(project: SingleCellProject) {
  const reducer = createReducer(project)

  const store = configureStore({
    reducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  })

  return store
}

export type SingleCellStore = ReturnType<typeof createStore>
export type SingleCellStoreDispatch = SingleCellStore["dispatch"]
export type SingleCellStoreState = ReturnType<SingleCellStore["getState"]>
