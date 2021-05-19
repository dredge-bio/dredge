import { Config, TranscriptData } from '../types'

export type SeuratCell = {
  cellID: string;
  umap1: number;
  umap2: number;
  replicateID: string;
  clusterID: string;
}

export type SeuratCluster = {
  clusterID: string;
  clusterLabel: string;
}

export type ClusterDGE = {
  clusterID: string,
  transcriptID: string,
  logFC: number,
  pValue: number,
  pctExpressedCluster: number,
  pctExpressedOther: number,
}

export type SeuratCellMap = Map<string, SeuratCell>

export type SingleCellProjectConfig = Config & {
  type: "SingleCell"
  expressionData: string;
  transcripts: string;
  seuratEmbeddings: string;
  seuratMetadata: string;
  differentialExpressions: string;
}

export type SingleCellProjectData = TranscriptData & {
  readme: string | null;
  cells: SeuratCellMap;
  expressionData: DataView;
  differentialExpressions: ClusterDGE[];
  // clusters: SeuratCluster[]
}

export type TranscriptWithClusterDGE = {
  transcript: string;
  dgeByCluster: Map<string, ClusterDGE>;
}
