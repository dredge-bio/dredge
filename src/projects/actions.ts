import * as tPromise from 'io-ts-promise'
import * as t from 'io-ts'
import { fold, isLeft, Left, Right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { ConfigDef, ConfigKey } from './config'
import { actions as logAction } from '../log'

import { createAction, createAsyncAction } from '../actions'

import * as fields from './fields'

import { delay, fetchResource, getDefaultGrid } from '../utils'

import {
  DredgeConfig,
  ProjectSource,
  LogStatus,
  ProjectTreatments,
  ProjectData,
} from '../types'

function getGlobalWatchedGenesKey() {
  return window.location.pathname + '-watched'
}

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

export const loadProjectConfig = createAsyncAction<
  { source: ProjectSource },
  { config: DredgeConfig }
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
    const log = makeResourceLog(null, 'Project configuration', configURL)

    try {

      log('Pending')

      resp = await fetchResource(configURL)

      log('OK')
    } catch (e) {
      const { message } = e

      log('Failed', 'Configuration file not found')
      throw new Error()
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

export const loadProject = createAsyncAction<
  { source: ProjectSource },
  {
    data: ProjectData,
    watchedTranscripts: Set<string>,
    config: DredgeConfig,
  }
>('load-project', async (args, { dispatch, getState }) => {
  const project = args.source
      , projectState = getState().projects[args.source.key]

  if (projectState.loaded && !projectState.failed) {
    return {
      config: projectState.config,
      data: projectState.data,
      watchedTranscripts: projectState.watchedTranscripts,
    }
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

  if (treatments === null) {
    projectStatusLog('Could not load project because loading treatments failed.')
    throw new Error()
  }

  const [
    abundanceMeasures,
    aliases,
    readme,
    svg,
    grid,
  ] = await Promise.all([
    fields.abundanceMeasures.validateFromURL(
      config.abundanceMeasures, makeLog, treatments),

    fields.aliases.validateFromURL(
      config.transcriptAliases, makeLog, treatments),

    fields.readme.validateFromURL(
      config.readme, makeLog, treatments),

    fields.svg.validateFromURL(
      config.diagram, makeLog, treatments),

    fields.grid.validateFromURL(
      config.grid, makeLog, treatments),
  ])

  if (abundanceMeasures === null) {
    projectStatusLog('Could not load project because loading abundance measures failed.')
    throw new Error()
  }

  const { transcripts, replicates, abundances } = abundanceMeasures

  projectStatusLog('Validating expression matrix...')

  try {
    validateExpressionMatrix(treatments, abundanceMeasures)
  } catch (e) {
    projectStatusLog(e.message)
    throw new Error()
  }

  const numReplicates = [...treatments.values()].reduce(
    (ct, { replicates }) => ct + replicates.length,
    0)

  projectStatusLog(
    'Dataset: ' +
     `${treatments.size.toLocaleString()} treatments, ` +
     `${numReplicates.toLocaleString()} replicates, ` +
     `${transcripts.length.toLocaleString()} transcripts.`)

  // FIXME: make this a loading log once entries can be keyed by something other
  // than URL
  projectStatusLog('Building transcript corpus...')

  const { corpus, transcriptAliases } = await buildTranscriptCorpus(transcripts, aliases || {})

  const transcriptIndices: Record<string, number> = {}
      , replicateIndices: Record<string, number> = {}

  {
    let i = 0
    for (const t of transcripts) {
      transcriptIndices[t] = i;
      i++
      if (i % 100 === 0) await delay(0)
    }
  }

  {
    let i = 0
    for (const r of replicates) {
      replicateIndices[r] = i;
      i++
      if (i % 100 === 0) await delay(0)
    }
  }

  projectStatusLog('Finished building transcript corpus')

  const watchedTranscripts = args.source.key === 'local'
    ? new Set([] as string[])
    : new Set(await getGlobalWatchedTranscripts())

  projectStatusLog('Finished loading project')


  return {
    config,
    data: {
      treatments,
      transcripts,
      replicates,
      abundances,
      transcriptCorpus: corpus,
      transcriptAliases,
      transcriptIndices,
      replicateIndices,
      svg,
      grid: grid || getDefaultGrid(Object.keys(treatments)),
      readme,
    },
    watchedTranscripts,
  }
})

async function buildTranscriptCorpus(transcripts: string[], transcriptAliases: Record<string, string[]>) {
  const corpus: Record<string, string> = {}
      , corpusVals: ([alias: string, transcript: string])[] = []

  let i = 0
  for (const [ transcript, aliases ] of Object.entries(transcriptAliases)) {
    for (const alias in [...aliases, transcript]) {
      // FIXME: This should probably throw if an alias is not unique (i.e. can
      // can identify two different transcripts)
      corpus[alias] = transcript
      corpusVals.push([alias, transcript])

      i++
      if (i % 5000 === 0) await delay(0)
    }
  }

  i = 0
  transcripts.forEach(transcript => {
    if (!(transcript in corpus)) {
      corpus[transcript] = transcript
      corpusVals.push([transcript, transcript])
    }
  })

  return {
    corpus,
    transcriptAliases: corpusVals,
  }
}

function validateExpressionMatrix(
  treatments: ProjectTreatments,
  { replicates }: { replicates: string[] }
) {
  const matrixReplicates = new Set(replicates)
      , missingReplicates: { treatment: string, id: string }[] = []

  treatments.forEach((treatment, treatmentID) => {
    treatment.replicates.forEach(replicate => {
      if (!matrixReplicates.has(replicate)) {
        missingReplicates.push({
          treatment: treatmentID,
          id: replicate
        })
      }
    })
  })

  if (missingReplicates.length) {
    const missingStr = missingReplicates.map(({ treatment, id }) => `${id} (for ${treatment})`).join(', ')
    throw new Error(`Missing ${missingReplicates.length} replicates from expression matrix: ` + missingStr)
  }

  return
}

async function getGlobalWatchedTranscripts() {
  const watchedTranscriptsKey = getGlobalWatchedGenesKey()

  try {
    const decoder = t.array(t.string)
        , watchedFromLocalStorage = JSON.parse(localStorage[watchedTranscriptsKey] || '[]')
        , config = await tPromise.decode(decoder, watchedFromLocalStorage)

    return config
  } catch (e) {
    localStorage.removeItem(watchedTranscriptsKey)
    return [] as string[]
  }
}
