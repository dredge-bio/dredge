import {
  ProjectSource,
  TableSortOrder,
  BulkPairwiseComparison,
  BulkDifferentialExpression,
  BulkProject,
  SingleCellProject,
  TranscriptWithClusterDGE,
} from '../types'

export type BulkTableSortPath =
  'label' |
  'pValue' |
  'logATA' |
  'logFC' |
  'treatmentA_AbundanceMean' |
  'treatmentA_AbundanceMedian' |
  'treatmentB_AbundanceMean' |
  'treatmentB_AbundanceMedian'

export type BulkDisplayedTranscriptsSource =
  'all' |
  'selectedBin' |
  'hoveredBin' |
  'brushed' |
  'watched'

export type TranscriptsView = {
  focusedTranscript: string | null;
  hoveredTranscript: string | null;
  hoveredTreatment: string | null;

  savedTranscripts: Set<string>;
}

export type BaseView = {
  loading: boolean;
}

export type BulkViewState = BaseView & TranscriptsView & {
  project: BulkProject,
  pairwiseData: BulkPairwiseComparison | null;
  sortedTranscripts: Array<BulkDifferentialExpression>;
  pValueThreshold: number;

  comparedTreatments: [string, string] | null;

  brushedArea: [
    minLogATA: number,
    maxLogFC: number,
    maxLogATA: number,
    minLogFC: number
  ] | null;

  hoveredBinTranscripts: Set<string> | null;
  selectedBinTranscripts: Set<string> | null;

  displayedTranscripts: null | {
    source: BulkDisplayedTranscriptsSource,
    transcripts: Array<BulkDifferentialExpression>,
  },

  order: TableSortOrder;

  sortPath: BulkTableSortPath;
}

export type SingleCellViewState = BaseView & TranscriptsView & {
  project: SingleCellProject;
  selectedClusters: Set<string> | null;

  // FIXME: make nullable?
  displayedTranscriptsWithClusters: TranscriptWithClusterDGE[];
}
