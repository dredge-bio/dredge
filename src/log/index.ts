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

export const actions = {
  log: createAction<{
    project: ProjectSource | null,
    log: LogEntry,
  }>('append-log'),

  resetProjectLog: createAction<{
    project: ProjectSource,
  }>('reset-project-log'),
}

interface LogState {
  main: Array<LogEntry>,
  projects: Record<ProjectSource['key'], Array<LogEntry>>,
}


function initialState(): LogState {
  return {
    main: [],
    projects: {
      local: [],
      global: [],
    },
  }
}

export const reducer = createReducer(initialState(), builder => {
  builder
    .addCase(actions.log, (state, action) => {
      const { project, log } = action.payload

      const logToAppend = project
        ? state.projects[project.key]
        : state.main

      logToAppend.push(log)

    })
    .addCase(actions.resetProjectLog, (state, action) => {
      const { project } = action.payload

      state.projects[project.key] = []
    })
})
