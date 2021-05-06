import { Config } from '../types'
import { ProjectSource, TableSortOrder } from '../../types'

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

export type BulkProjectData = {
  treatments: BulkTreatmentMap,

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

export type BulkDifferentialExpression = {
  name: string;
  label: string,

  treatmentA_AbundanceMean: number | null;
  treatmentA_AbundanceMedian: number | null;
  treatmentB_AbundanceMean: number | null;
  treatmentB_AbundanceMedian: number | null;
  pValue: number | null;
  logFC: number | null;
  logATA: number | null;
}

export interface BulkPairwiseComparison extends Map<string, BulkDifferentialExpression> {
  minPValue: number;
  fcSorted: Array<BulkDifferentialExpression>;
  ataSorted: Array<BulkDifferentialExpression>;
}
