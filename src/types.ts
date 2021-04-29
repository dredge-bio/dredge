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

export interface ProjectLog {
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

export type LoadedProject = { loaded: true } & (
  {
    type: 'SingleCell',
    config: SingleCellProjectConfig,
    data: SingleCellProjectData,
  } |
  {
    type: 'Bulk',
    config: BulkProjectConfig,
    data: BulkProjectData,
    pairwiseComparisonCache: {
      [index: string]: BulkPairwiseComparison | null
    };
    watchedTranscripts: Set<string>,
  }
)

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

