import * as tPromise from 'io-ts-promise'
import * as t from 'io-ts'

import { BulkConfiguration } from './config'

import { CreateFieldLogger } from '@dredge/log'

import {
  ProjectSource,
  BulkProject,
  buildIndexMap
} from '@dredge/main'

import * as bulkFields from './fields'

import {
  fields as commonFields,
  buildTranscriptCorpus
} from '@dredge/shared'

import { getDefaultGrid } from './utils'

import { BulkTreatmentMap } from './types'

export const labels: Map<keyof BulkConfiguration, string> = new Map([
  ['label', 'Project label'],
  ['readme', 'Project documentation'],
  ['permalinkPrefix', 'Permalink prefix'],
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

export async function loadProject(
  source: ProjectSource,
  config: BulkConfiguration,
  projectStatusLog: (message: string) => void,
  makeLog: CreateFieldLogger
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

    commonFields.aliases.validateFromURL(
      config.transcriptAliases, makeLog),

    commonFields.readme.validateFromURL(
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
    if (e instanceof Error) {
      projectStatusLog(e.message)
    }
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

  const { corpus, transcriptAliases } = await buildTranscriptCorpus(transcripts, aliases || new Map())

  const transcriptIndices = await buildIndexMap(transcripts)
      , replicateIndices = await buildIndexMap(replicates)

  projectStatusLog('Finished building transcript corpus')

  const watchedTranscripts = source === 'local'
    ? new Set([] as string[])
    : new Set(await getGlobalWatchedTranscripts())

  projectStatusLog('Finished loading project')

  return {
    type: 'Bulk',
    source,
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

function getGlobalWatchedGenesKey() {
  return window.location.pathname + '-watched'
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
