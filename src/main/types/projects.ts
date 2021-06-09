import { BulkProjectData, BulkProjectConfig, BulkPairwiseComparison } from '@dredge/bulk'
import { SingleCellProjectData, SingleCellProjectConfig } from '@dredge/single-cell/types'

export type ProjectSource = 'local' | 'global'

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
