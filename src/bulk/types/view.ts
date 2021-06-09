import {
  TranscriptView,
  BaseView,
  TableSortOrder
} from '@dredge/shared'

import { BulkProject } from '@dredge/main'

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


export type BulkDifferentialExpression = {
  name: string;
  label: string,

  treatmentA_AbundanceMean: number | null;
  treatmentA_AbundanceMedian: number | null;
  treatmentB_AbundanceMean: number | null;
  treatmentB_AbundanceMedian: number | null;
  pValue: number | null;
  logFC: number | null;
  logATA: number | null;
}

export interface BulkPairwiseComparison extends Map<string, BulkDifferentialExpression> {
  minPValue: number;
  fcSorted: Array<BulkDifferentialExpression>;
  ataSorted: Array<BulkDifferentialExpression>;
}

export type BulkViewState = BaseView & TranscriptView & {
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
