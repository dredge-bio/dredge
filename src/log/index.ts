import { createAction, createReducer, PayloadAction } from '@reduxjs/toolkit'

import {
  DredgeConfig,
  ProjectSource,
  ThunkConfig,
  LogStatus,
} from '../ts_types'

interface StatusLogEntry {
  message: string,
}

interface ResourceLogEntry {
  url: string,
  label: string,
  status: LogStatus,
  message: string | null,
}

type LogEntry = StatusLogEntry | ResourceLogEntry

type Log = {
  project: ProjectSource | null,
  log: LogEntry,
}

export const actions = {
  log: createAction<Log>('append-log'),

  resetProjectLog: createAction<{
    project: ProjectSource,
  }>('reset-project-log'),
}

type LogState = Array<Log>


function initialState(): LogState {
  return []
}

export const reducer = createReducer(initialState(), builder => {
  builder
    .addCase(actions.log, (state, action) => {
      return [...state, action.payload]

    })
    .addCase(actions.resetProjectLog, (state, action) => {
      const { project } = action.payload

      return state.filter(
        log => (
          log.project &&
          log.project.key === project.key))
    })
})
