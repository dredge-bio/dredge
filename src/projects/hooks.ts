import * as React from 'react'
import * as d3 from 'd3'
import * as R from 'ramda'
import {
  ProjectSource,
  Project,
  LoadedProject,
} from '../types'

import {
  getAbundanceLookup,
  getColorScaleLookup,
  getTranscriptLookup,
  getSearchTranscripts,
} from './utils'

import {
  useAppSelector,
} from '../hooks'

export function useProject(source: ProjectSource, requireLoaded: false): Project;
export function useProject(source: ProjectSource, requireLoaded: true): LoadedProject;
export function useProject(source: ProjectSource, requireLoaded: boolean): Project | LoadedProject {
  const project = useAppSelector(state => state.projects[source.key])

  if (requireLoaded) {
    if (!project.loaded || project.failed) {
      throw new Error(`Project ${source.key} is not yet loaded`)
    }

    return project
  }

  return project
}

export function useAbundances(source: ProjectSource={ key: 'global' }) {
  const project = useProject(source, true)

  return {
    abundancesForTreatmentTranscript: getAbundanceLookup(project),
    colorScaleForTranscript: getColorScaleLookup(project),
  }
}

export function useTranscripts(source: ProjectSource={ key: 'global' }) {
  const project = useProject(source, true)

  const { transcripts } = project.data

  return {
    transcripts,
    getCanonicalTranscriptLabel: getTranscriptLookup(project),
    searchTranscripts: getSearchTranscripts(project),
  }
}
