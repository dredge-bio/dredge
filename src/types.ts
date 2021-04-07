"use strict";

import { ORGShellResource } from 'org-shell'

import { AppDispatch, AppState } from './store'

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

export interface Resource extends ORGShellResource<{
  dispatch: AppDispatch,
  getState: () => AppState,
}> {
  makeTitle?: (state: DredgeState) => string;
  absoluteDimensions?: boolean;
}

export type ProjectSource = LocalProjectSource | GlobalProjectSource;


export interface ProjectTreatment {
  label: string;
  replicates: Array<ReplicateLabel>;
}

export type ProjectTreatments = Map<TreatmentName, ProjectTreatment>

// FIXME: it might happen that there is *just* a name, in the case where a
// transcript is not present in a pairwise comparison (e.g. maybe someone
// added a transcript from the search bar, or maybe a certain transcript has
// zeroes on some treatments versus others
export interface DifferentialExpression {
  name: TranscriptName;
  label: string,

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

export type SortPath =
  'label' |
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

type UnloadedProjectWithoutConfig = {
  loaded: false;
}

type UnloadedProject = {
  loaded: false;
  config: DredgeConfig;
}

type FailedProject = {
  loaded: true;
  failed: true,
}

export type ProjectData = {
  treatments: ProjectTreatments,

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


export interface LoadedProject {
  loaded: true;
  failed: false;
  config: DredgeConfig;

  // Static information about the project
  data: ProjectData,

  pairwiseComparisonCache: {
    [index: string]: PairwiseComparison | null
  };

  watchedTranscripts: Set<string>,
}

export type Project =
  UnloadedProjectWithoutConfig |
  UnloadedProject |
  FailedProject |
  LoadedProject

export type DredgeState = AppState
