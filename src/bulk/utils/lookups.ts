import * as d3 from 'd3'
import * as R from 'ramda'

import { memoizeForProject } from '@dredge/shared'
import { BulkProject } from '@dredge/main'

export {
  getTranscriptLookup,
  getSearchTranscripts
} from '@dredge/shared'

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
