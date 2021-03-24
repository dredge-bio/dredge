
import { createAsyncThunk, createAction } from '@reduxjs/toolkit'
import * as tPromise from 'io-ts-promise'
import * as t from 'io-ts'
import { fold, isLeft, Left, Right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { ConfigDef, ConfigKey } from './config'
import { actions as logAction } from '../log'

import { delay } from '../utils'
import {
  DredgeConfig,
  ProjectSource,
  ThunkConfig,
  LogStatus
} from '../ts_types'

async function fetchResource(url: string, cache=true) {
  const headers = new Headers()

  if (!cache) {
    headers.append('Cache-Control', 'no-cache')
  }

  const resp = await fetch(url, { headers })

  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error('File not found')
    }

    throw new Error(`Error requesting file (${resp.statusText || resp.status })`)
  }

  return resp
}

const labels: Map<ConfigKey, string> = new Map([
  ['label', 'Project label'],
  ['url', 'Project URL'],
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
>('load-project', async (args, { dispatch, getState }) => {
  const { source } = args
      , project = getState().projects[source.key]

  if ('config' in project) {
    return { config: project.config }
  }

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
    const url = new URL(`project.json#${value}`, window.location.toString()).href
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

  projectStatusLog('`project.json` well formatted. Continuning to load project')

  throw Error()

  const config = await tPromise.decode(ConfigDef, await resp.json())

  await delay(0)

  return { config }
})

/*

function __loadProjectConfig(source) {
  return async (dispatch, getState) => {
    const existing = R.path(['projects', source.key, 'config'], getState())

    if (existing) return { config: existing }

    const makeProjectLog = R.curry((label, url, status) => {
      return dispatch(Action.Log(
        source.key,
        label,
        url,
        status
      ))
    })

    // We should only be dealing with the global config at this point, because
    // the local one is set beforehand. But maybe we want to support loading
    // arbitrary remote projects at some point (again, lol). In that case, the
    // global project would not be assumed.
    const configURL = new URL('./project.json', window.location).href

    let loadedConfig = {}

    {
      const log = makeProjectLog('Project configuration', configURL)

      await log(LoadingStatus.Pending(null))

      try {
        const resp = await fetchResource(configURL, false)

        try {
          loadedConfig = await resp.json()
        } catch (e) {
          throw new Error('Project configuration file malformed')
        }

        await log(LoadingStatus.OK(null))
      } catch (e) {
        let { message } = e

        if (message === 'File not found') {
          message = 'No configuration file present.'
        }

        await log(LoadingStatus.Failed(message))

        return { config: null }
      }
    }

    const config = {}

    await Promise.all(Object.entries(configFields).map(async ([ key, { label, test }]) => {
      const url = new URL(`project.json#${key}`, window.location).href
          , log = makeProjectLog(label, url)

      await log(LoadingStatus.Pending(null))

      const val = loadedConfig[key]

      if (!val) {
        await log(LoadingStatus.Missing('No value specified'))
        return
      }

      try {
        test(val);

        await log(LoadingStatus.OK(null))

        config[key] = val
      } catch (e) {
        await log(LoadingStatus.Failed(e.message))
      }
    }))

    await delay(0)

    return { config }
  }
}
*/
