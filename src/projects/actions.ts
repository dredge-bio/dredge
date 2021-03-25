
import { createAsyncThunk, createAction } from '@reduxjs/toolkit'
import * as tPromise from 'io-ts-promise'
import * as t from 'io-ts'
import { fold, isLeft, Left, Right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { ConfigDef, ConfigKey } from './config'
import { actions as logAction } from '../log'

import * as fields from './fields'

import { delay, fetchResource } from '../utils'

import {
  DredgeConfig,
  ProjectSource,
  ThunkConfig,
  LogStatus
} from '../ts_types'

const labels: Map<ConfigKey, string> = new Map([
  ['label', 'Project label'],
  ['readme', 'Project documentation'],
  ['abundanceMeasures', 'Transcript abundance measures'],
  ['heatmapMinimumMaximum', 'Abundance heatmap color scale floor'],
  ['abundanceLimits', 'Limits for abundance measures'],
  ['treatments', 'Treatment descriptions'],
  ['pairwiseName', 'Pairwise comparison file naming format'],
  ['transcriptHyperlink', 'Transcript hyperlink'],
  ['transcriptAliases', 'Alternate names for transcripts'],
  ['diagram', 'Project diagram'],
  ['grid', 'Project grid'],
])

export const loadProjectConfig = createAsyncThunk<
  { config: DredgeConfig },
  { source: ProjectSource },
  ThunkConfig
>('load-project-config', async (args, { dispatch, getState }) => {
  const { source } = args
      , project = getState().projects[source.key]

  if ('config' in project) {
    return { config: project.config }
  }

  const makeResourceLog = (project: ProjectSource | null, label: string, url: string) =>
    (status: LogStatus, message?: string) => {
      dispatch(logAction.log({
        project,
        log: {
          url,
          label,
          status,
          message: message || null,
        }
      }))
    }

  const makeStatusLog = (project: ProjectSource | null) =>
    (message: string) => {
      dispatch(logAction.log({
        project,
        log: {
          message,
        },
      }))
    }


  // We should only be dealing with the global config at this point, because
  // the local one is set beforehand. But maybe we want to support loading
  // arbitrary remote projects at some point (again, lol). In that case, the
  // global project would not be assumed.
  const configURL = new URL('./project.json', window.location.toString()).href

  let resp: Response

  const statusLog = makeStatusLog(null)
      , projectStatusLog = makeStatusLog(source)

  statusLog('Checking for project configuration')

  {
    const log = makeResourceLog(source, 'Project configuration', configURL)

    try {

      log('Pending')

      resp = await fetchResource(configURL)

      log('OK')
    } catch (e) {
      const { message } = e
      // console.error(e)
      log('Failed', 'Resource not found')
      throw new Error('FIXME problem')
    }
  }

  statusLog('Loaded `project.json`, using global project')

  projectStatusLog('Checking if `project.json` well formatted')

  const json = await resp.json()


  for (const [configKey, value ] of labels) {
    const url = new URL(`project.json#${configKey}`, window.location.toString()).href
        , decoder = ConfigDef.props[configKey].asDecoder()

    const log = makeResourceLog(source, value, url)

    await log('Pending')

    pipe(
      decoder.decode(json[configKey]) as Left<t.Errors> | Right<any>,
      fold(
        errors => {
          log('Failed')
          console.log(errors)
        },
        val => {
          log('OK')
        }
      ))
  }

  projectStatusLog('`project.json` well formatted')

  const config = await tPromise.decode(ConfigDef, json)

  await delay(0)

  return { config }
})

export const loadProject = createAsyncThunk<
  void,
  { source: ProjectSource },
  ThunkConfig
>('load-project', async (args, { dispatch, getState }) => {
  const project = args.source
      , projectState = getState().projects[args.source.key]

  if (projectState.loaded) return

  const makeResourceLog = (project: ProjectSource | null, label: string, url: string) =>
    (status: LogStatus, message?: string) =>
      dispatch(logAction.log({
        project,
        log: {
          url,
          label,
          status,
          message: message || null,
        }
      }))

  const makeStatusLog = (project: ProjectSource | null) =>
    (message: string) =>
      dispatch(logAction.log({
        project,
        log: {
          message,
        },
      }))

  const projectStatusLog = makeStatusLog(args.source)

  projectStatusLog('Loading project')

  if (!('config' in projectState)) {
    projectStatusLog('No configuration present')
    throw new Error()
  }

  const { config } = projectState

  const makeLog = makeResourceLog.bind(null, project)

  // Load treatments before anything else
  const treatments = await fields.treatments.validateFromURL(
    config.treatments, makeLog)

  const runFields = [
  ]

})
