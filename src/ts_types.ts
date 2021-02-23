"use strict";

export type ReplicateLabel = string;
export type TranscriptName = string;
export type TreatmentName = string;

type URLString = string;

interface LocalProjectSource {
  key: 'local'
}

interface GlobalProjectSource {
  key: 'global'
}

export type ProjectSource = LocalProjectSource | GlobalProjectSource;


export interface ProjectTreatment {
  label: TreatmentName;
  replicates: Array<ReplicateLabel>;
}

export interface DifferentialExpression {
  // FIXME: rename this to transcriptName
  name: TranscriptName;
  treatmentA_AbundanceMean: number | null;
  treatmentA_AbundanceMedian: number | null;
  treatmentB_AbundanceMean: number | null;
  treatmentB_AbundanceMedian: number | null;
  pValue: number;
  logFC: number;
  logATA: number;
}

export interface PairwiseComparison extends Map<string, DifferentialExpression> {
  minPValue: number;
  fcSorted: Array<DifferentialExpression>;
  ataSorted: Array<DifferentialExpression>;
}

export interface Project {
  treatments: {
    [index: string]: ProjectTreatment
  };
  pairwiseComparisonCache: {
    [index: string]: PairwiseComparison | null
  };

  getCanonicalTranscriptLabel: (label: string) => TranscriptName;

  abundancesForTreatmentTranscript: (
    treatmentID: TreatmentName,
    transcriptName: TranscriptName
  ) => Array<number> | null,
}

export interface ViewState {
  source: ProjectSource;
  loading: boolean;
  pairwiseData: PairwiseComparison | null;
  sortedTranscripts: Array<DifferentialExpression> | null;
  pValueThreshold: number;

  focusedTranscript: TranscriptName | null;
  hoveredTranscript: TranscriptName | null;
  hoveredTreatment: TreatmentName | null;

  savedTranscripts: Set<TranscriptName>;

  brushedArea: [
    // minLogATA
    number,

    // maxLogFC
    number,

    // maxLogATA
    number,

    // minLogFC
    number
  ] | null;

  hoveredBinTranscripts: Set<TranscriptName> | null;
  selectedBinTranscripts: Set<TranscriptName> | null;

  displayedTranscripts: Array<DifferentialExpression> | null;

  order: 'asc' | 'desc';

  sortPath: Array<string>;
}

export interface DredgeConfig {
  label: string;
  readme: URLString;
  transcriptHyperlink: Array<{
    label: string,
    url: URLString,
  }>;
  abundanceLimits: [
    [number, number],
    [number, number]
  ];
  heatmapMinimumMaximum: number;
  treatments: URLString;
  pairwiseName: URLString;
  transcriptAliases: URLString;
  abundanceMeasures: URLString;
  diagram: URLString;
  grid: URLString;
}

export interface DredgeState {
  log: any;

  projects: {
    global: Project | null,
    local: Project | null,
  };

  view: ViewState | null;
}
