import {
  TranscriptView,
  BaseView,
  TableSortOrder
} from '@dredge/shared'

import { SingleCellProject } from '@dredge/main'

import { ClusterDGE, SeuratCluster } from './project'

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
  selectedClusters: Set<string>;
  selectedTranscripts: Set<string>;

  hoveredCluster: {
    cluster: SeuratCluster | null;
    source: 'UMAP' | 'HeatMap';
  };

  // FIXME: make nullable?
  displayedTranscriptsWithClusters: TranscriptWithClusterDGE[];
  order: TableSortOrder;
  sortPath: SingleCellSortPath;
}
