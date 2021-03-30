import * as d3 from 'd3'
import * as R from 'ramda'

import {
  Project,
  LoadedProject,
} from '../types'

function ensureProjectLoaded(project: Project) {
  if (!project.loaded || project.failed) {
    throw new Error(`Project is not yet loaded`)
  }

  return project
}

function memoizeForProject<T, U extends object>(
  cache: WeakMap<U, T>, 
  getCacheKey: (project: LoadedProject) => U,
  makeCache: (project: LoadedProject) => T
) {
  return (project: Project) => {
    const loadedProject = ensureProjectLoaded(project)
        , cacheKey = getCacheKey(loadedProject)
        , cached = cache.get(cacheKey)

    if (cached) return cached

    const fn = makeCache(loadedProject)

    cache.set(cacheKey, fn)

    return fn
  }
}

const abundanceLookupCache: WeakMap<
  object, 
  (treamentID: string, transcriptName: string) => number[]
> = new WeakMap()

// FIXME: Should this be indexed by the canonical transcript label?
export const getAbundanceLookup = memoizeForProject(
  abundanceLookupCache,
  project => project.data.abundances,
  project => {
    const {
      treatments,
      transcriptIndices,
      replicateIndices,
      abundances
    } = project.data

    const cached = abundanceLookupCache.get(abundances)

    if (cached) return cached

    const fn = function abundancesForTreatmentTranscript(treatmentID: string, transcriptName: string) {
      const treatment = treatments.get(treatmentID)

      if (!treatment) {
        throw new Error(`No such treatment in dataset: ${treatmentID}`)
      }

      const transcriptIdx = transcriptIndices[transcriptName]

      return treatment.replicates.reduce((acc, replicateID) => {
        const replicateIdx = replicateIndices[replicateID]!

        if (transcriptIdx === undefined) return acc

        // This is guaranteed to exist 
        const abundance = abundances[transcriptIdx]![replicateIdx]!

        return [...acc, abundance]
      }, [] as number[])
    }

    return fn
  }
)

const colorScaleLookupCache: WeakMap<
  object,
  (transcriptID: string) => d3.ScaleSequential<string, never>
> = new WeakMap()

export const getColorScaleLookup = memoizeForProject(
  colorScaleLookupCache,
  project => project.data.abundances,
  project => {
    const { abundances, treatments } = project.data

    const abundancesForTreatmentTranscript = getAbundanceLookup(project)

    const fn = R.memoizeWith(R.identity, (transcriptName: string) => {
      const { heatmapMinimumMaximum: minMax=0 } = project.config

      let maxAbundance = 1

      Object.keys(treatments).forEach(treatmentID => {
        const abundance = d3.mean(abundancesForTreatmentTranscript(treatmentID, transcriptName)) || 0

        if (abundance > maxAbundance) {
          maxAbundance = abundance
        }
      })

      if (maxAbundance < minMax) {
        maxAbundance = minMax
      }

      return d3.scaleSequential([0, maxAbundance], d3.interpolateOranges)
    })

    colorScaleLookupCache.set(abundances, fn)

    return fn
  }
)

const transcriptLookupCache: WeakMap<
  object,
  (transcriptID: string) => string
> = new WeakMap()

export const getTranscriptLookup = memoizeForProject(
  transcriptLookupCache,
  project => project.data.transcriptCorpus,
  project => {
    const { transcriptCorpus } = project.data

    const fn = function getCanonicalTranscriptLabel(transcriptName: string) {
      return transcriptCorpus[transcriptName]
    }

    return fn
  }
)

type TranscriptSearchResult = {
  alias: string;
  canonical: string;
}

const searchTranscriptsCache: WeakMap<
  object,
  (transcriptID: string, limit: number) => TranscriptSearchResult[]
> = new WeakMap()

export const getSearchTranscripts = memoizeForProject(
  searchTranscriptsCache,
  project => project.data.transcriptAliases,
  project => {
    const { transcriptAliases } = project.data

    function searchTranscripts (name: string, limit=20) {
      const results: TranscriptSearchResult[] = []

      for (const x of transcriptAliases) {
        if (x[0].startsWith(name)) {
          results.push({
            alias: x[0],
            canonical: x[1],
          })

          if (results.length === limit) break;
        }
      }

      return results
    }

    return searchTranscripts
  }
)
