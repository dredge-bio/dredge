import * as t from 'io-ts'
import { inflate } from 'pako'

import { ProjectField } from '../fields'

type SeuratMetadata = {
  cellID: string;
  replicateID: string;
  seuratCluster: number;
}

type SeuratEmbedding = {
  cellID: string;
  umap1: number;
  umap2: number;
}

const seuratEmbeddingsCodec = new t.Type<
  SeuratEmbedding,
  string[]
>(
  'seuratEmbedding',
  (u): u is SeuratEmbedding => {
    // ???
    return true
  },
  (u, c) => {
    if (!Array.isArray(u)) {
      return t.failure(u, c)
    }

    function assertString(val: unknown) {
      if (typeof val !== 'string') {
        throw new Error()
      }

      return val
    }

    try {
      const cellID = assertString(u[0])
          , umap1 = assertString(u[1])
          , umap2 = assertString(u[2])

      return t.success({
        cellID,
        umap1: parseFloat(umap1),
        umap2: parseFloat(umap2),
      })
    } catch (e) {
      return t.failure(u, c)
    }
  },
  () => {
    throw new Error()
  }
)

async function noopPromise<T>(x: T) {
  return x
}

export const embeddings = new ProjectField({
  label: 'Seurat UMAP embeddings',
  required: true,
  cached: false,
  decoder: t.array(seuratEmbeddingsCodec),
  processValidated: noopPromise,
})

const seuratMetadataCodec = new t.Type<SeuratMetadata>(
  'seuratMetadata',
  (u): u is SeuratMetadata => {
    // ???
    return true
  },
  (u, c) => {
    if (!Array.isArray(u)) {
      return t.failure(u, c)
    }

    function assertString(val: unknown) {
      if (typeof val !== 'string') {
        throw new Error()
      }

      return val
    }

    try {
      const cellID = assertString(u[0])
          , replicateID = assertString(u[1])
          , seuratCluster = assertString(u[5])

      return t.success({
        cellID,
        replicateID,
        seuratCluster: parseInt(seuratCluster),
      })
    } catch (e) {
      return t.failure(u, c)
    }
  },
  () => {
    throw new Error()
  }
)

export const metadata = new ProjectField({
  label: 'Seurat metadata',
  required: true,
  cached: false,
  decoder: t.array(seuratMetadataCodec),
  processValidated: noopPromise,
})

const seuratExpressionCodec = new t.Type<DataView>(
  'seuratMetadata',
  (u): u is DataView => {
    // ???
    return true
  },
  (u, c) => {
    if (!(u instanceof ArrayBuffer)) {
      return t.failure(u, c)
    }

    const uint8arr = new Uint8Array(u)
        , res = inflate(uint8arr)
        , view = new DataView(res.buffer)

    return t.success(view)
  },
  () => {
    throw new Error()
  }
)

export const expressionData = new ProjectField({
  label: 'Transcript expression data',
  required: true,
  cached: false,
  decoder: seuratExpressionCodec,
  processValidated: noopPromise,
  processResponse: resp => {
    return resp.arrayBuffer()
  },
})
