import { createReducer } from '@reduxjs/toolkit'

import { createAction, ProjectSource } from '@dredge/main'

export * from './components'

let id = 0

export type LogBase = {
  logID: number;
}

export type LogStatus = {
  type: 'Pending';
  percent: number;
} | {
  type: 'Pending';
  message?: string;
} | {
  type: 'Failed';
  message: string;
} | {
  type: 'Missing';
} | {
  type: 'OK';
  message?: string;
}

export type ResourceLogEntry = LogBase & {
  url: string;
  label: string;
  status: LogStatus;
}

export type StatusLogEntry = LogBase & {
  message: string;
}

export type LogEntry = StatusLogEntry | ResourceLogEntry

export type CreateFieldLogger =
  (label: string, url: string) =>
    (status: LogStatus, message?: string) => void

export type Log = {
  project: ProjectSource | null,
  timestamp: number,
  log: LogEntry,
}

export const actions = {
  getNextLogID: createAction('get-next-log-id', () => {
    return {
      payload: {
        logID: id++,
      },
    }
  }),

  log: createAction<{
    project: ProjectSource | null,
    log: LogEntry,
  }>('append-log'),

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
      const { project, log } = action.payload

      const entry = {
        project,
        log,
        timestamp: new Date().getTime(),
      }
      return [...state, entry]

    })
    .addCase(actions.resetProjectLog, (state, action) => {
      const { project } = action.payload

      return state.filter(
        log => (
          log.project &&
          log.project === project))
    })
})
