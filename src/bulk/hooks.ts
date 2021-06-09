import { BulkProject } from '@dredge/main'

import {
  getAbundanceLookup,
  getColorScaleLookup,
  getTranscriptLookup,
  getSearchTranscripts
} from './utils'

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
