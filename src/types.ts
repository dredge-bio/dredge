"use strict";

import { ORGShellResource } from 'org-shell'
import { AppDispatch, AppState } from './store'

import { BulkProjectData, BulkProjectConfig, BulkPairwiseComparison } from './projects/bulk/types'
import { SingleCellProjectData, SingleCellProjectConfig } from './projects/sc/types'

export type DredgeState = AppState

export type ThunkConfig = {
  state: DredgeState;
}

export type ReplicateLabel = string;
export type TranscriptName = string;
export type TreatmentName = string;

export interface Resource extends ORGShellResource<{
  dispatch: AppDispatch,
  getState: () => AppState,
}> {
  makeTitle?: (state: DredgeState) => string;
  absoluteDimensions?: boolean;
}

export type ProjectSource = 'local' | 'global'


export type TableSortOrder = 'asc' | 'desc'


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

export type ProjectType = 'SingleCell' | 'Bulk'

type ProjectBase = {
  source: ProjectSource,
}

export type UnloadedProject = { loaded: false } & (
  {
    type: 'SingleCell',
    config: SingleCellProjectConfig,
  } |
  {
    type: 'Bulk',
    config: BulkProjectConfig,
  }
)

export type SingleCellProject = ProjectBase & {
  type: 'SingleCell',
  config: SingleCellProjectConfig,
  data: SingleCellProjectData,
}

export type BulkProject = ProjectBase & {
    type: 'Bulk',
    config: BulkProjectConfig,
    data: BulkProjectData,
    pairwiseComparisonCache: {
      [index: string]: BulkPairwiseComparison | null
    };
    watchedTranscripts: Set<string>,
}

export type LoadedProject = BulkProject | SingleCellProject

type UnloadedProjectWithoutConfig = {
  loaded: false;
}

type FailedProject = {
  loaded: true;
  failed: true,
}

export type Project =
  UnloadedProjectWithoutConfig |
  UnloadedProject |
  FailedProject |
  LoadedProject

export * from './projects/bulk/types'
export * from './projects/sc/types'
export * from './view/types'
