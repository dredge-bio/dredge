import * as t from 'io-ts'
import { fold, Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import * as bulk from '@dredge/bulk'
import * as singleCell from '@dredge/single-cell'
import { LogStatus } from '@dredge/log'

import {
  delay,
  fetchResource,
  createAsyncAction,
  ProjectSource,
  BulkProject,
  SingleCellProject
} from '@dredge/main'

import { actions as logAction } from '../log'


type ConfigurationDefinition = typeof bulk.configuration | typeof singleCell.configuration

type Configuration = bulk.BulkConfiguration | singleCell.SingleCellConfiguration


export const loadProjectConfig = createAsyncAction<
  {
    source: ProjectSource
  },
  {
    config: Configuration
  }
>('load-project-config', async (args, { dispatch, getState }) => {
  const { source } = args
      , project = getState().projects.directory[source]

  if (project && 'config' in project) {
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
        },
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

  let configJson: any

  const statusLog = makeStatusLog(null)
      , projectStatusLog = makeStatusLog(source)

  statusLog('Checking for project configuration')

  let definition: ConfigurationDefinition

  {
    let resp: Response

    const log = makeResourceLog(null, 'Project configuration', configURL)

    try {

      log('Pending')

      resp = await fetchResource(configURL, false)

      log('OK')
    } catch (e) {
      // const { message } = e

      log('Failed', 'Configuration file not found')
      throw new Error()
    }

    try {
      configJson = await resp.json()
    } catch (e) {
      log('Failed', 'Configuration file not valid json')
    }

    if (configJson.type === 'Bulk' || configJson.type === undefined) {
      configJson.type = 'Bulk'

      const labels = bulk.labels
          , configDef = definition = bulk.configuration

      for (const [ configKey, value ] of labels) {
        const url = new URL(`project.json#${configKey}`, window.location.toString()).href
            , decoder = configDef.props[configKey].asDecoder()

        const log = makeResourceLog(source, value, url)

        await log('Pending')

        const decoded: Either<t.Errors, any> = decoder.decode(configJson[configKey])

        pipe(
          decoded,
          fold(
            errors => {
              log('Failed')
              console.log(errors)
            },
            () => {
              log('OK')
            }
          ))
        await delay(0)
      }
    } else if (configJson.type === 'SingleCell') {
      const labels = singleCell.labels
          , configDef = definition = singleCell.configuration

      // Repeated from above :-(
      // See https://github.com/microsoft/TypeScript/issues/30581
      for (const [ configKey, value ] of labels) {
        const url = new URL(`project.json#${configKey}`, window.location.toString()).href
            , decoder = configDef.props[configKey].asDecoder()

        const log = makeResourceLog(source, value, url)

        await log('Pending')

        const decoded: Either<t.Errors, any> = decoder.decode(configJson[configKey])

        pipe(
          decoded,
          fold(
            errors => {
              log('Failed')
              console.log(errors)
            },
            (val: any) => {
              if (val === null || (val.length === 0)) {
                log('Missing')
              } else {
                log('OK')
              }
            }
          ))
        await delay(0)
      }
    } else {
        const message = 'Project type must be either `Bulk` or `SingleCell`'
        log('Failed', message)
        throw new Error(message)
    }
  }

  statusLog('Loaded `project.json`, using global project')

  projectStatusLog('Checking if `project.json` well formatted')

  const parsed: Either<t.Errors, Configuration> = definition.decode(configJson)

  if (parsed._tag === 'Right') {
    projectStatusLog('`project.json` well formatted')
    return {
      config: parsed.right,
    }
  } else {
    projectStatusLog('Could not load project. See errors above.')
    throw new Error()
  }
})




export const loadProject = createAsyncAction<
  { source: ProjectSource },
  (BulkProject | SingleCellProject)
>('load-project', async (args, { dispatch, getState }) => {
  const { source } = args
      , project = getState().projects.directory[source]

  if (!project) {
    throw new Error()
  }

  if (!('loaded' in project)) {
    return project
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
        },
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

  if (!('config' in project)) {
    projectStatusLog('No configuration present')
    throw new Error()
  }

  const { config } = project

  const makeLog = makeResourceLog.bind(null, source)

  let loadedProject: BulkProject | SingleCellProject

  if (config.type === 'Bulk') {
    loadedProject = await bulk.loadProject(
      args.source,
      config,
      projectStatusLog,
      makeLog
    )
  } else if (config.type === 'SingleCell') {
    loadedProject = await singleCell.loadProject(
      args.source,
      config,
      projectStatusLog,
      makeLog
    )
  } else {
    throw Error()
  }

  await delay(0)

  return loadedProject
})
