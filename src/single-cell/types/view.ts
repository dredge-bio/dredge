import {
  TranscriptView,
  BaseView,
  TableSortOrder
} from '@dredge/shared'

import { SingleCellProject } from '@dredge/main'

import { ClusterDGE } from './project'

export type TranscriptWithClusterDGE = {
  transcript: string;
  dgeByCluster: Map<string, ClusterDGE>;
}

export type SingleCellSortPath =
  'transcript' |
  { cluster: string, value: 'pValue' | 'logFC' }

export type SingleCellViewState = BaseView & TranscriptView & {
  project: SingleCellProject;
  selectedClusters: Set<string> | null;

  // FIXME: make nullable?
  displayedTranscriptsWithClusters: TranscriptWithClusterDGE[];
  order: TableSortOrder;
  sortPath: SingleCellSortPath;
}
