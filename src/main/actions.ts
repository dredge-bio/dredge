import {
  createAsyncThunk,
  createAction,
  AsyncThunkPayloadCreator
} from '@reduxjs/toolkit'

import { DredgeState } from './types'

type ThunkConfig = {
  state: DredgeState
}

export function asyncActionCreatorWithConfig<T>() {
  return function createAsyncAction<Request, Response>(
    actionName: string,
    payloadCreator: AsyncThunkPayloadCreator<Response, Request, T>
  ) {
    return createAsyncThunk<Response, Request, T>(actionName, payloadCreator)
  }
}

export function createAsyncAction<Request, Response>(
  actionName: string,
  payloadCreator: AsyncThunkPayloadCreator<Response, Request, ThunkConfig>
) {
  return createAsyncThunk<Response, Request, ThunkConfig>(actionName, payloadCreator)
}

export { createAction }
