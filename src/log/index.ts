import { createReducer } from '@reduxjs/toolkit'

import { createAction, ProjectSource } from '@dredge/main'

export * from './components'

let id = 0

export type LogStatus = 'Pending' | 'Failed' | 'Missing' | 'OK'

export interface StatusLogEntry {
  message: string,
}

export interface ResourceLogEntry {
  url: string,
  label: string,
  status: LogStatus,
  message: string | null,
}

type LogEntry = StatusLogEntry | ResourceLogEntry

export type CreateFieldLogger =
  (label: string, url: string) =>
    (status: LogStatus, message?: string) => void

export type Log = {
  project: ProjectSource | null,
  id: number,
  timestamp: number,
  log: LogEntry,
}

export const actions = {
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
        id: id++,
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
