import { DifferentialExpression, DisplayedTranscriptsSource } from '../../types'

export type TranscriptCallback = (transcript: string | null) => void

export type TranscriptData = {
  displayedTranscripts: {
    source: DisplayedTranscriptsSource;
    transcripts: Array<DifferentialExpression>;
  };
  savedTranscripts: Set<string>;
  pValueThreshold: number;
  columnWidths: number[];
  focusedTranscript: string | null;

  setHoveredTranscript: TranscriptCallback;
  addSavedTranscript: TranscriptCallback;
  removeSavedTranscript: TranscriptCallback;
  setFocusedTranscript: TranscriptCallback;
}
