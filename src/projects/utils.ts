import * as d3 from 'd3'
import * as R from 'ramda'

import {
  LoadedProject,
  BulkProject
} from '../types'

function memoizeForProject<P extends LoadedProject>() {
  return function memoized<T, U extends object>(
    cache: WeakMap<U, T>,
    getCacheKey: (project: P) => U,
    makeCache: (project: P) => T
  ) {
    return (project: P) => {
      const cacheKey = getCacheKey(project)
          , cached = cache.get(cacheKey)

      if (cached) return cached

      const fn = makeCache(project)

      cache.set(cacheKey, fn)

      return fn
    }
  }
}

const abundanceLookupCache: WeakMap<
  object,
  (treamentID: string, transcriptName: string) => number[]
> = new WeakMap()

// FIXME: Should this be indexed by the canonical transcript label?
export const getAbundanceLookup = memoizeForProject<BulkProject>()(
  abundanceLookupCache,
  project => project.data.abundances,
  project => {
    const {
      treatments,
      transcriptIndices,
      replicateIndices,
      abundances,
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
  (transcriptID: string) => d3.ScaleLinear<number, string>
> = new WeakMap()

export const getColorScaleLookup = memoizeForProject<BulkProject>()(
  colorScaleLookupCache,
  project => project.data.abundances,
  project => {
    const { abundances, treatments } = project.data

    const abundancesForTreatmentTranscript = getAbundanceLookup(project)

    const fn = R.memoizeWith(R.identity, (transcriptName: string) => {
      const { heatmapMinimumMaximum: minMax=0 } = project.config

      let maxAbundance = 1

      Array.from(treatments.keys()).forEach(treatmentID => {
        const abundance = d3.mean(abundancesForTreatmentTranscript(treatmentID, transcriptName)) || 0

        if (abundance > maxAbundance) {
          maxAbundance = abundance
        }
      })

      if (maxAbundance < minMax) {
        maxAbundance = minMax
      }

      return d3.scaleSequential([0, maxAbundance], d3.interpolateOranges) as unknown as d3.ScaleLinear<number, string>
    })

    colorScaleLookupCache.set(abundances, fn)

    return fn
  }
)

const transcriptLookupCache: WeakMap<
  object,
  (transcriptID: string) => string | null
> = new WeakMap()

// FIXME: make this work for any loaded project
export const getTranscriptLookup = memoizeForProject<BulkProject>()(
  transcriptLookupCache,
  project => project.data.transcriptCorpus,
  project => {
    const { transcriptCorpus } = project.data

    const fn = function getCanonicalTranscriptLabel(transcriptName: string) {
      return transcriptCorpus[transcriptName] || null
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

// FIXME: make this work for any loaded project
export const getSearchTranscripts = memoizeForProject<BulkProject>()(
  searchTranscriptsCache,
  project => project.data.transcriptAliases,
  project => {
    const { transcriptAliases } = project.data

    function searchTranscripts (name: string, limit=20) {
      const results: TranscriptSearchResult[] = []

      for (const x of transcriptAliases) {
        if (x[0].startsWith(name)) {
          results.push({
            alias: x[0], canonical: x[1],
          })

          if (results.length === limit) break;
        }
      }

      return results
    }

    return searchTranscripts
  }
)
