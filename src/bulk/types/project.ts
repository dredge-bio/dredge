import { Config, TranscriptData } from '@dredge/shared'

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

export type BulkProjectData = TranscriptData & {
  treatments: BulkTreatmentMap,

  replicates: string[],
  abundances: number[][],
  transcriptIndices: Record<string, number>,
  replicateIndices: Record<string, number>,

  svg: string | null;
  grid: (string | null)[][],

  readme: string | null;
}
