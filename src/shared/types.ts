
export type TranscriptView = {
  focusedTranscript: string | null;
  hoveredTranscript: string | null;
  hoveredTreatment: string | null;

  savedTranscripts: Set<string>;
}

export type BaseView = {
  loading: boolean;
}

export type TableSortOrder = 'asc' | 'desc'

