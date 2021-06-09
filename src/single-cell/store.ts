import { useDispatch } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { SingleCellProject } from '@dredge/main'

import createReducer from './reducer'


export default function createStore(project: SingleCellProject) {
  return configureStore({
    reducer: createReducer(project),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      })
  })
}

type SingleCellStore = ReturnType<typeof createStore>

export type SingleCellDispatch = SingleCellStore["dispatch"]
