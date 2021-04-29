import { Config } from '../types'

export type BulkProjectConfig = Config & {
  type: "Bulk"
  abundanceLimits: [
    [number, number],
    [number, number]
  ];
  heatmapMinimumMaximum: number;
  treatments: string;
  pairwiseName: string;
  transcriptAliases: string;
  abundanceMeasures: string;
  diagram: string;
  grid: string;
}

export interface BulkTreatment {
  label: string;
  replicates: Array<string>;
}

export type BulkTreatmentMap = Map<string, BulkTreatment>

export type BulkProjectData = {
  treatments: BulkTreatmentMap,

  // From the abundance matrix
  transcripts: string[],
  replicates: string[],
  abundances: number[][],
  transcriptIndices: Record<string, number>,
  replicateIndices: Record<string, number>,

  transcriptCorpus: Record<string, string>;
  transcriptAliases: ([alias: string, transcript: string])[],

  svg: string | null;
  grid: (string | null)[][],

  readme: string | null;
}

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

export type BulkTableSortPath =
  'label' |
  'pValue' |
  'logATA' |
  'logFC' |
  'treatmentA_AbundanceMean' |
  'treatmentA_AbundanceMedian' |
  'treatmentB_AbundanceMean' |
  'treatmentB_AbundanceMedian'

export type BulkDisplayedTranscriptSource =
  'all' |
  'selectedBin' |
  'hoveredBin' |
  'brushed' |
  'watched'

export interface BulkViewState {
  source: ProjectSource;
  loading: boolean;
  pairwiseData: PairwiseComparison | null;
  sortedTranscripts: Array<DifferentialExpression>;
  pValueThreshold: number;

  focusedTranscript: string | null;
  hoveredTranscript: string | null;
  hoveredTreatment: string | null;

  savedTranscripts: Set<string>;

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
    source: DisplayedTranscriptsSource,
    transcripts: Array<DifferentialExpression>,
  },

  order: SortOrder;

  sortPath: SortPath;
}
