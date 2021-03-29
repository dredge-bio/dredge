import * as React from 'react'
import * as d3 from 'd3'
import * as R from 'ramda'
import {
  useAppSelector,
  ProjectSource,
  Project,
  LoadedProject,
} from '../ts_types'

function useProject(source: ProjectSource, requireLoaded: false): Project;
function useProject(source: ProjectSource, requireLoaded: true): LoadedProject;
function useProject(source: ProjectSource, requireLoaded: boolean): Project | LoadedProject {
  const project = useAppSelector(state => state.projects[source.key])

  if (requireLoaded) {
    if (!project.loaded || project.failed) {
      throw new Error(`Project ${source.key} is not yet loaded`)
    }

    return project
  }

  return project
}

function useAbundances(source: ProjectSource={ key: 'global' }) {
  const project = useProject(source, true)

  const {
    treatments,
    transcripts,
    replicates,
    abundances,
    transcriptIndices,
    replicateIndices,
  } = project.data

  // FIXME: Should this be indexed by the canonical transcript label?
  const abundancesForTreatmentTranscript = (treatmentID: string, transcriptName: string) => {
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

  // FIXME: Memoize this so the same fn is always returned for a project
  const colorScaleForTranscript = R.memoizeWith(R.identity, (transcriptName: string) => {
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

  return {
    abundancesForTreatmentTranscript,
    colorScaleForTranscript,
  }
}

function useTranscripts(source: ProjectSource={ key: 'global' }) {
  const project = useProject(source, true)

  const {
    transcripts,
    transcriptCorpus,
    transcriptAliases,
  } = project.data

  const getCanonicalTranscriptLabel = (transcriptName: string) => {
    return transcriptCorpus[transcriptName]
  }

  const searchTranscripts = (name: string, limit=20) => {
    const results: ({ alias: string, canonical: string })[] = []

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

  return {
    transcripts,
    getCanonicalTranscriptLabel,
    searchTranscripts,
  }
}
