"use strict";

import { Action } from 'redux'
import { ThunkDispatch } from 'redux-thunk'
import { ORGShellResource } from 'org-shell'

export type ThunkConfig = {
  state: DredgeState
}

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

export interface Resource extends ORGShellResource {
  makeTitle?: (state: DredgeState) => string;
  absoluteDimensions?: boolean;
}

export type ProjectSource = LocalProjectSource | GlobalProjectSource;


export interface ProjectTreatment {
  label: TreatmentName;
  replicates: Array<ReplicateLabel>;
}

// FIXME: it might happen that there is *just* a name, in the case where a
// transcript is not present in a pairwise comparison (e.g. maybe someone
// added a transcript from the search bar, or maybe a certain transcript has
// zeroes on some treatments versus others
export interface DifferentialExpression {
  // FIXME: rename this to transcriptName
  name: TranscriptName;

  treatmentA_AbundanceMean: number | null;
  treatmentA_AbundanceMedian: number | null;
  treatmentB_AbundanceMean: number | null;
  treatmentB_AbundanceMedian: number | null;
  pValue: number | null;
  logFC: number | null;
  logATA: number | null;
}

export interface PairwiseComparison extends Map<string, DifferentialExpression> {
  minPValue: number;
  fcSorted: Array<DifferentialExpression>;
  ataSorted: Array<DifferentialExpression>;
}

export interface Project {
  loaded: boolean;
  failed: boolean;

  treatments: {
    [index: string]: ProjectTreatment
  };

  pairwiseComparisonCache: {
    [index: string]: PairwiseComparison | null
  };

  config: DredgeConfig;

  svg: string | null;
  readme: string | null;

  getCanonicalTranscriptLabel: (label: string) => TranscriptName;

  // FIXME
  colorScaleForTranscript: (transcriptName: TranscriptName) => any;


  abundancesForTreatmentTranscript: (
    treatmentID: TreatmentName,
    transcriptName: TranscriptName
  ) => Array<number> | null,
}

export type SortPath =
  'name' |
  'pValue' |
  'logATA' |
  'logFC' |
  'treatmentA_AbundanceMean' |
  'treatmentA_AbundanceMedian' |
  'treatmentB_AbundanceMean' |
  'treatmentB_AbundanceMedian'

export type SortOrder = 'asc' | 'desc'

export interface ViewState {
  source: ProjectSource;
  loading: boolean;
  pairwiseData: PairwiseComparison | null;
  sortedTranscripts: Array<DifferentialExpression>;
  pValueThreshold: number;

  focusedTranscript: TranscriptName | null;
  hoveredTranscript: TranscriptName | null;
  hoveredTreatment: TreatmentName | null;

  savedTranscripts: Set<TranscriptName>;

  comparedTreatments: [TreatmentName, TreatmentName] | null;

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

  order: SortOrder;

  sortPath: SortPath;
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

export type LogStatus = 'Pending' | 'Failed' | 'Missing' | 'OK'

export interface LogEntry {
  key: string,
  label: string,
  files: Array<{
    url: string,
    label: string,
    status: LogStatus,
  }>;
  metadata: Array<{
    field: string,
    label: string,
    status: LogStatus,
  }>
}

export interface ProjectLog {
}

export interface DredgeState {
  log: any;

  projects: {
    global: Project | null,
    local: Project | null,
  };

  view: ViewState | null;
}

export type DredgeDispatch = ThunkDispatch<DredgeState, null, Action>
