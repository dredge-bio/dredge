import { Config, TranscriptData, TableSortOrder } from '@dredge/shared'

export { TableSortOrder }

export type SingleCellProjectConfig = Config & {
  type: "SingleCell"
  expressionData: string;
  transcripts: string;
  seuratEmbeddings: string;
  seuratMetadata: string;
  differentialExpressions: string;
}

export type SeuratCell = {
  cellID: string;
  umap1: number;
  umap2: number;
  replicateID: string;
  clusterID: string;
}

export type SeuratCluster = {
  id: string;
  label: string;
  cells: Array<SeuratCell>;
  midpoint: [number, number];
  color: string,
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

export type SeuratClusterMap = Map<string, SeuratCluster>

export type SingleCellProjectData = TranscriptData & {
  readme: string | null;
  cells: SeuratCellMap;
  expressionData: DataView;
  differentialExpressions: ClusterDGE[];
  clusters: SeuratClusterMap;
}
