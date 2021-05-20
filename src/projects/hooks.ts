import {
  ProjectSource,
  ProjectType,
  LoadedProject,
  SingleCellProject,
  BulkProject
} from '../types'

import {
  getAbundanceLookup,
  getColorScaleLookup,
  getTranscriptLookup,
  getSearchTranscripts
} from './utils'

import {
  useAppSelector
} from '../hooks'

export function useProject(source: ProjectSource, type: 'SingleCell'): SingleCellProject;
export function useProject(source: ProjectSource, type: 'Bulk'): BulkProject;
export function useProject(source: ProjectSource, type: ProjectType): LoadedProject {
  const project = useAppSelector(state => state.projects[source])

  if (!project || 'failed' in project || 'loaded' in project) {
    throw new Error(`Project ${source} is not yet loaded`)
  }

  if (type === 'SingleCell' && project.type === 'SingleCell') {
    return project
  } else if (type === 'Bulk' && project.type === 'Bulk') {
    return project
  } else {
    throw new Error(
      `Requested project type is ${type}, but project ${source} is of type ${project.type}`)
  }
}

export function useAbundances(project: BulkProject) {
  return {
    abundancesForTreatmentTranscript: getAbundanceLookup(project),
    colorScaleForTranscript: getColorScaleLookup(project),
  }
}

export function useTranscripts(project: BulkProject) {
  const { transcripts } = project.data

  return {
    transcripts,
    getCanonicalTranscriptLabel: getTranscriptLookup(project),
    searchTranscripts: getSearchTranscripts(project),
  }
}
