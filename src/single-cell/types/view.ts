import {
  TranscriptView,
  BaseView,
  TableSortOrder
} from '@dredge/shared'

import { SingleCellProject } from '@dredge/main'

import { ClusterDGE } from './project'

export type TranscriptWithClusterDGE = {
  transcript: {
    id: string;
    label: string;
  };
  dgeByCluster: Map<string, ClusterDGE>;
}

export type SingleCellSortPath =
  'transcript' |
  'hasInsitu' |
  { cluster: string, value: 'pValue' | 'logFC' }

export type SingleCellViewState = BaseView & TranscriptView & {
  project: SingleCellProject;
  selectedClusters: Set<string> | null;
  selectedTranscripts: Set<string>;

  // FIXME: make nullable?
  displayedTranscriptsWithClusters: TranscriptWithClusterDGE[];
  order: TableSortOrder;
  sortPath: SingleCellSortPath;
}
