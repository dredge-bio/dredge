import h from 'react-hyperscript'
import * as d3 from 'd3'
import * as React from 'react'
import * as t from 'io-ts'
import { fold } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { fetchResource } from '../../utils'

import padding from '../MAPlot/padding'
import { useDimensions } from '../MAPlot/hooks'

const { useEffect, useMemo, useRef, useState } = React

type SeuratMetadata = {
  transcriptID: string;
  replicateID: string;
  seuratCluster: number;
}

type SeuratEmbedding = {
  transcriptID: string;
  umap1: number;
  umap2: number;
}

const seuratMetadataCodec = new t.Type<
  SeuratMetadata,
  string[]
>(
  'seuratMetadata',
  (u): u is SeuratMetadata => {
    // ???
    return true
  },
  (u, c) => {
    if (!Array.isArray(u)) {
      throw new Error()
    }

    function assertString(val: unknown) {
      if (typeof val !== 'string') {
        throw new Error()
      }

      return val
    }

    const transcriptID = assertString(u[0])
        , replicateID = assertString(u[1])
        , seuratCluster = assertString(u[5])

    return t.success({
      transcriptID,
      replicateID,
      seuratCluster: parseInt(seuratCluster)
    })
  },
  x => {
    throw new Error()
  }
)

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
      throw new Error()
    }

    function assertString(val: unknown) {
      if (typeof val !== 'string') {
        throw new Error()
      }

      return val
    }

    function assertNumber(val: unknown) {
      if (typeof val !== 'number') {
        throw new Error()
      }

      return val
    }

    const transcriptID = assertString(u[0])
        , umap1 = assertString(u[1])
        , umap2 = assertString(u[2])

    return t.success({
      transcriptID,
      umap1: parseFloat(umap1),
      umap2: parseFloat(umap2)
    })
  },
  x => {
    throw new Error()
  }
)



function useSeuratData() {
  const [ metadata, setMetadata ] = useState<SeuratMetadata[]>()
      , [ embeddings, setEmbeddings ] = useState<SeuratEmbedding[]>()

  useEffect(() => {
    fetchResource('metadata.csv')
      .then(resp => resp.text())
      .then(text => {
        const rawMetadata = d3.csvParseRows(text).slice(1)

        const metadata = pipe(
          t.array(seuratMetadataCodec).decode(rawMetadata),
          fold(
            () => {
              throw new Error()
            },
            value => value))

        setMetadata(metadata)
      })

    fetchResource('embeddings.csv')
      .then(resp => resp.text())
      .then(text => {
        const rawEmbeddings = d3.csvParseRows(text).slice(1)

        const embeddings = pipe(
          t.array(seuratEmbeddingsCodec).decode(rawEmbeddings),
          fold(
            () => {
              throw new Error()
            },
            value => value))

        setEmbeddings(embeddings)
      })
  }, [])

  if (embeddings && metadata) {
    return {
      embeddings,
      metadata,
    }
  }

  return {
    embeddings: null,
    metadata: null,
  }
}

function useAxes(
  svgRef: React.RefObject<SVGSVGElement>,
  width: number,
  height: number,
  embeddings: SeuratEmbedding[]
) {
  const umap1Extent = useMemo(
    () => d3.extent(embeddings, x => x.umap1) as [number, number],
    [embeddings])

  const umap2Extent = useMemo(
    () => d3.extent(embeddings, x => x.umap2) as [number, number],
    [embeddings])

  console.log(umap1Extent, umap2Extent)

  const dimensions = useDimensions({
    height,
    width,
    transform: d3.zoomIdentity,
    xDomain: umap1Extent,
    yDomain: umap2Extent,
  })

  dimensions.xScale = dimensions.xScale.nice()
  dimensions.yScale = dimensions.yScale.nice()

  useEffect(() => {
    const svgEl = svgRef.current

    const { xScale, yScale } = dimensions

    const xEl = d3.select(svgEl)
      .select<SVGGElement>('.x-axis')

    xEl.selectAll('*').remove()

    xEl.call(d3.axisBottom(xScale))

    const yEl = d3.select(svgEl)
      .select<SVGGElement>('.y-axis')

    yEl.selectAll('*').remove()

    yEl.call(d3.axisLeft(yScale));

    yScale.ticks().forEach(y => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(xScale.domain()[0]!)))
        .attr('x2', Math.ceil(xScale(xScale.domain()[1]!)))
        .attr('y1', Math.ceil(yScale(y)))
        .attr('y2', Math.ceil(yScale(y)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    });

    xScale.ticks().forEach(x => {
      yEl.append('line')
        .attr('x1', Math.ceil(xScale(x)))
        .attr('x2', Math.ceil(xScale(x)))
        .attr('y1', Math.ceil(yScale(yScale.domain()[0]!)))
        .attr('y2', Math.ceil(yScale(yScale.domain()[1]!)))
        .attr('stroke', '#eee')
        .attr('stroke-width', 1)
    })
  }, [dimensions])

  return dimensions
}

function useEmbeddings(
  svgRef: React.RefObject<SVGSVGElement>,
  dimensions: ReturnType<typeof useDimensions>,
  embeddings: SeuratEmbedding[],
  metadata: SeuratMetadata[]
) {
  useEffect(() => {
    const svgEl = svgRef.current
        , { xScale, yScale } = dimensions

    const embeddingsByTranscriptID: Map<string, SeuratEmbedding> =
      new Map(embeddings.map(obj => [obj.transcriptID, obj]))

    const clusters: Map<number, {
      embeddings: SeuratEmbedding[],
      points: [number, number ][],
    }> = new Map()

    metadata.forEach(val => {
      const { seuratCluster, transcriptID } = val

      if (!clusters.has(seuratCluster)) {
        clusters.set(seuratCluster, {
          embeddings: [],
          points: [],
        })
      }

      const embedding = embeddingsByTranscriptID.get(transcriptID)!
          , point = [xScale(embedding.umap1), yScale(embedding.umap2)] as [number, number]

      const cluster = clusters.get(seuratCluster)!

      cluster.embeddings.push(embedding)
      cluster.points.push(point)
    })

    const clusterColor = d3.scaleOrdinal(d3.schemeTableau10)
      .domain([...clusters.keys()].map(x => x.toString()))

    clusters.forEach((cluster, i) => {
      /*
      const hull = d3.polygonHull(cluster.points)

      if (!hull) return

      const path = `M${hull.join("L")}Z`

      d3.select(svgEl)
        .select('g.umap')
        .append('path')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
      */

      d3.select(svgEl)
        .select('g.umap')
        .append('g')
        .selectAll('circle')
        .data(cluster.embeddings).enter()
          .append('circle')
          .attr('r', 1)
          .attr('cx', d => xScale(d.umap1))
          .attr('cy', d => yScale(d.umap2))
          .attr('fill', clusterColor(i.toString()))
          .attr('stroke', 'none')
    })

    /*

    d3.select(svgEl)
      .select('g.umap')
      .append('g')
      .selectAll('circle')
      .data(embeddings).enter()
        .append('circle')
        .attr('r', 1)
        .attr('cx', d => xScale(d.umap1))
        .attr('cy', d => yScale(d.umap2))
        .attr('fill', '#666')
        .attr('stroke', 'none')
        */

  }, [embeddings])
}

type SingleCellProps = {
  metadata: SeuratMetadata[];
  embeddings: SeuratEmbedding[];
}

function SingleCell(props: SingleCellProps) {
  const { metadata, embeddings } = props
      , svgRef = useRef<SVGSVGElement>(null)
      , dimensions = useAxes(svgRef, 800, 800, embeddings)

  useEmbeddings(svgRef, dimensions, embeddings, metadata)

  return (
    h('svg', {
      position: 'absolute',
      top: 0,
      bottom: 0,
      height: dimensions.height,
      width: dimensions.width,
      viewBox: `0 0 ${dimensions.width} ${dimensions.height}`,
      ref: svgRef,
    }, [
      h('defs', [
      ]),

      // X Axis label
      h('text', {
        dx: padding.l,
        dy: padding.t,
        x: dimensions.plotWidth / 2,
        y: dimensions.plotHeight + (dimensions.padding.b / 2) + 6, // extra pixels to bump it down from axis
        style: {
          fontWeight: 'bold',
          textAnchor: 'middle',
          dominantBaseline: 'central',
        },
      }, 'UMAP_1'),

      // Y Axis label
      h('text', {
        x: 0,
        y: (dimensions.plotHeight / 2) + dimensions.padding.t,
        transform: `
          rotate(-90, 0, ${dimensions.plotHeight / 2 + dimensions.padding.t})
          translate(0, ${dimensions.padding.l / 2 - 6})
        `,
        style: {
          fontWeight: 'bold',
          textAnchor: 'middle',
          dominantBaseline: 'central',
        },
      }, 'UMAP_2'),

      h('g', {
        transform: `translate(${padding.l}, ${padding.t})`,
      }, [
        h('rect', {
          fill: '#f9f9f9',
          stroke: '#ccc',
          x: 0,
          y: 0,
          width: dimensions.plotWidth,
          height: dimensions.plotHeight,
        }),

        h('g.x-axis', {
          transform: `translate(0, ${dimensions.plotHeight})`,
        }),
        h('g.y-axis'),

        h('g', { clipPath: 'url(#visible-plot)' }, [
          h('g.umap'),
        ]),
      ]),
    ])
  )
}

export default function SingleCellLoader() {
  const { embeddings, metadata } = useSeuratData()

  if (embeddings === null || metadata === null) return null

  return h(SingleCell, {
    embeddings,
    metadata,
  })
}
