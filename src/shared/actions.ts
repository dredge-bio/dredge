import * as d3 from 'd3'
import * as R from 'ramda'
import { createAction, LoadedProject } from '@dredge/main'
import { getTranscriptLookup } from '@dredge/shared'
import { ImportedTranscript } from './types'

export const setHoveredTranscript = createAction<
  { transcript: string | null }
>('set-hovered-transcript')

export const setFocusedTranscript = createAction<
  { transcript: string | null }
>('set-focused-transcript')

type ImportArgs = {
  project: LoadedProject;
  text: string;
}

export const importSavedTranscripts = createAction(
  'import-saved-transcript',
  (args: ImportArgs) => {
  const { text, project } = args

  const rows = d3.tsvParseRows(text.trim())

  if (R.path([0, 0], rows) === 'Gene name') {
    rows.shift()
  }

  const transcriptsInFile = rows.map(row => row[0])
      , getCanonicalTranscriptLabel = getTranscriptLookup(project)
      , newWatchedTranscripts = []
      , imported: Array<ImportedTranscript> = []
      , skipped: Array<string> = []

  for (const t of transcriptsInFile) {
    if (t === undefined) continue

    const canonicalName = getCanonicalTranscriptLabel(t)

    if (canonicalName) {
      imported.push([t, canonicalName])
      newWatchedTranscripts.push(canonicalName)
    } else {
      skipped.push(t)
    }
  }

  // FIXME
  /*
  const existingWatchedTranscripts = view.savedTranscripts
  await dispatch(Action.SetSavedTranscripts(
    [...newWatchedTranscripts, ...existingWatchedTranscripts]
  ))
  */

  return {
    payload: {
      imported,
      skipped,
    },
  }
})
