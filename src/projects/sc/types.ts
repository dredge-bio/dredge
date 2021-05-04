import { Config } from '../types'

export type SeuratCell = {
  cellID: string;
  umap1: number;
  umap2: number;
  replicateID: string;
  clusterID: number;
}

export type SeuratCluster = {
  clusterID: number;
  clusterLabel: string;
}

export type SeuratCellMap = Map<string, SeuratCell>

export type SingleCellProjectConfig = Config & {
  type: "SingleCell"
  expressionData: string;
  transcripts: string;
  seuratEmbeddings: string;
  seuratMetadata: string;
}

export type SingleCellProjectData = {
  cells: SeuratCellMap;
  transcripts: Map<string, string[]>;
  expressionData: DataView;
  // clusters: SeuratCluster[]
}
