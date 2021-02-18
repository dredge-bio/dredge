"use strict";

export type ReplicateLabel = string;
export type TranscriptName = string;


export interface ProjectTreatment {
  label: string;
  replicates: Array<ReplicateLabel>;
}

export interface Project {
  treatments: {
    [index: string]: ProjectTreatment
  };
}

export interface DifferentialExpression {
  // FIXME: rename this to transcriptName
  name: TranscriptName;
  treatmentA_AbundanceMean: number;
  treatmentA_AbundanceMedian: number;
  treatmentB_AbundanceMean: number;
  treatmentB_AbundanceMedian: number;
  pValue: number;
  logFC: number;
  logATA: number;
}

export interface PairwiseComparison extends Map<string, DifferentialExpression> {
  minPValue: number;
  fcSorted: Array<DifferentialExpression>;
  ataSorted: Array<DifferentialExpression>;
}
