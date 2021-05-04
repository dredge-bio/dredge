import * as tPromise from 'io-ts-promise'
import * as t from 'io-ts'
import { fold, Either } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { BulkConfiguration, bulkConfiguration } from './bulk/config'
import { SingleCellConfiguration, singleCellConfiguration } from './sc/config'
import { actions as logAction } from '../log'

import { createAsyncAction } from '../actions'

import * as bulkFields from './bulk/fields'
import * as singleCellFields from './sc/fields'

import { delay, fetchResource, getDefaultGrid } from '../utils'

import {
  ProjectSource,
  LogStatus,
  LoadedProject,
  BulkProject,
  SingleCellProject
} from '../types'

import {
  BulkTreatment,
  BulkTreatmentMap
} from './bulk/types'

import {
  SeuratCellMap
} from './sc/types'

function getGlobalWatchedGenesKey() {
  return window.location.pathname + '-watched'
}

const bulkLabels: Map<keyof BulkConfiguration, string> = new Map([
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

const singleCellLabels: Map<keyof SingleCellConfiguration, string> = new Map([
  ['label', 'Project label'],
  ['readme', 'Project documentation'],
  ['transcriptHyperlink', 'Transcript hyperlink'],
  ['seuratEmbeddings', 'Seurat UMAP embedding coordinates'],
  ['seuratMetadata', 'Seurat cell metadata'],
  ['transcripts', 'List of transcripts'],
  ['expressionData', 'Transcript expression data'],
])

type ConfigurationDefinition = typeof bulkConfiguration | typeof singleCellConfiguration
type Configuration = BulkConfiguration | SingleCellConfiguration


export const loadProjectConfig = createAsyncAction<
  { source: ProjectSource },
  { config: Configuration }
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

      resp = await fetchResource(configURL)

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

      const labels = bulkLabels
          , configDef = definition = bulkConfiguration

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
      }
    } else if (configJson.type === 'SingleCell') {
      const labels = singleCellLabels
          , configDef = definition = singleCellConfiguration

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

async function loadBulkProject(
  source: ProjectSource,
  config: BulkConfiguration,
  projectStatusLog: (message: string) => void,
  makeLog: (label: string, url: string) => (status: LogStatus, message?: string) => void,
): Promise<BulkProject> {
  // Load treatments before anything else
  const treatments = await bulkFields.treatments.validateFromURL(
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
    bulkFields.abundanceMeasures.validateFromURL(
      config.abundanceMeasures, makeLog),

    bulkFields.aliases.validateFromURL(
      config.transcriptAliases, makeLog),

    bulkFields.readme.validateFromURL(
      config.readme, makeLog),

    bulkFields.svg.validateFromURL(
      config.diagram, makeLog, { treatments }),

    bulkFields.grid.validateFromURL(
      config.grid, makeLog, { treatments }),
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

  const watchedTranscripts = source.key === 'local'
    ? new Set([] as string[])
    : new Set(await getGlobalWatchedTranscripts())

  projectStatusLog('Finished loading project')

  return {
    type: 'Bulk',
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
      grid: grid || getDefaultGrid([...treatments.keys()]),
      readme,
    },
    watchedTranscripts,
    pairwiseComparisonCache: {},
  }
}

async function loadSingleCellProject(
  source: ProjectSource,
  config: SingleCellConfiguration,
  projectStatusLog: (message: string) => void,
  makeLog: (label: string, url: string) => (status: LogStatus, message?: string) => void
): Promise<SingleCellProject> {
  const [
    embeddings,
    metadata,
    expressionData,
    transcripts,
  ] = await Promise.all([
    singleCellFields.embeddings.validateFromURL(
      config.seuratEmbeddings, makeLog),

    singleCellFields.metadata.validateFromURL(
      config.seuratMetadata, makeLog),

    singleCellFields.expressionData.validateFromURL(
      config.expressionData, makeLog),

    bulkFields.aliases.validateFromURL(
      config.transcripts, makeLog),
  ])

  if (
    embeddings === null ||
    metadata === null ||
    expressionData === null ||
    transcripts === null
  ) {
    projectStatusLog('Could not load project.')
    throw new Error()
  }

  const embeddingMap = new Map(
    embeddings.map(x => ([ x.cellID, x])))

  const metadataMap = new Map(
    metadata.map(x => ([ x.cellID, x])))

  const allCells = new Set([...embeddingMap.keys(), ...metadataMap.keys()])
      , cellMap: SeuratCellMap = new Map()

  for (const cellID of allCells) {
    const embedding = embeddingMap.get(cellID)
        , metadata = metadataMap.get(cellID)

    if (!embedding) {
      projectStatusLog(`Cell ${cellID} was in Seurat metadata, but not in Seurat embeddings`)
      throw new Error()
    }

    if (!metadata) {
      projectStatusLog(`Cell ${cellID} was in Seurat embeddings, but not in Seurat metadata`)
      throw new Error()
    }

    cellMap.set(cellID, {
      ...metadata,
      ...embedding,
    })
  }

  return {
    type: 'SingleCell',
    config,
    data: {
      cells: cellMap,
      expressionData,
      transcripts: new Map(Object.entries(transcripts)),
    }
  }
}

export const loadProject = createAsyncAction<
  { source: ProjectSource },
  (BulkProject | SingleCellProject)
>('load-project', async (args, { dispatch, getState }) => {
  const project = args.source
      , projectState = getState().projects[args.source.key]

  if (projectState.loaded && !projectState.failed) {
    const { loaded, failed, ...rest } = projectState

    return rest
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

  if (!('config' in projectState)) {
    projectStatusLog('No configuration present')
    throw new Error()
  }

  const { config } = projectState

  const makeLog = makeResourceLog.bind(null, project)

  if (config.type === 'Bulk') {
    return await loadBulkProject(
      args.source,
      config,
      projectStatusLog,
      makeLog
    )
  } else if (config.type === 'SingleCell') {
    return await loadSingleCellProject(
      args.source,
      config,
      projectStatusLog,
      makeLog
    )
  } else {
    throw Error()
  }
})

async function buildTranscriptCorpus(transcripts: string[], transcriptAliases: Record<string, string[]>) {
  const corpus: Record<string, string> = {}
      , corpusVals: ([alias: string, transcript: string])[] = []

  let i = 0
  for (const [ transcript, aliases ] of Object.entries(transcriptAliases)) {
    for (const alias of [...aliases, transcript]) {
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
  treatments: BulkTreatmentMap,
  { replicates }: { replicates: string[] }
) {
  const matrixReplicates = new Set(replicates)
      , missingReplicates: { treatment: string, id: string }[] = []

  treatments.forEach((treatment, treatmentID) => {
    treatment.replicates.forEach(replicate => {
      if (!matrixReplicates.has(replicate)) {
        missingReplicates.push({
          treatment: treatmentID,
          id: replicate,
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
