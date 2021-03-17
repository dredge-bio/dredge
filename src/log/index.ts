import { createAction, createReducer, PayloadAction } from '@reduxjs/toolkit'

import {
  DredgeConfig,
  ProjectSource,
  ThunkConfig,
  LogStatus,
} from './ts_types'

export const actions = {
  log: createAction<{
    project: ProjectSource | null,
    resourceName: string | null,
    resourceURL: string | null,
    status: LogStatus,
  }>('append-log'),

  reset: createAction<void>('reset-log'),
}

interface LogEntry {
  status: LogStatus,
  url: string,
  label: string,
}

type LogState = Record<ProjectSource['key'] | '', Record<string, LogEntry>>

function initialState(): LogState {
  return {
    '': {},
    local: {},
    global: {},
  }
}

export const reducer = createReducer(initialState(), builder => {
  builder
    .addCase(actions.log, (state, action) => {
      const { project, resourceName, resourceURL, status } = action.payload

      const projectKey = project ? project.key : ''
          , url = resourceURL || ''
          , label = resourceName || ''
          , logEntryKey = url || label

      state[projectKey][logEntryKey] = {
        status,
        url,
        label
      }
    })
    .addCase(actions.reset, state => {
      return initialState()
    })
})
