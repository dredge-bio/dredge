import { configureStore } from '@reduxjs/toolkit'
import { BulkProject } from '@dredge/main'

import createReducer from './reducer'


export default function createStore(project: BulkProject) {
  return configureStore({
    reducer: createReducer(project),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  })
}

export type BulkStore = ReturnType<typeof createStore>
export type BulkStoreState = ReturnType<BulkStore["getState"]>
export type BulkStoreDispatch = BulkStore["dispatch"]
