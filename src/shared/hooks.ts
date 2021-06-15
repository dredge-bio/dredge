import { LoadedProject } from '@dredge/main'

import { getTranscriptLookup, getSearchTranscripts } from './util'

export function useTranscripts(project: LoadedProject) {
  const { transcripts } = project.data

  return {
    transcripts,
    getCanonicalTranscriptLabel: getTranscriptLookup(project),
    searchTranscripts: getSearchTranscripts(project),
  }
}

