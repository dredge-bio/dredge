import * as d3 from 'd3'
import * as React from 'react'
import padding from './padding'

const { useRef } = React

type DimensionsArgs = {
  height: number;
  width: number;
  transform: d3.ZoomTransform;
  abundanceLimits: [[number, number], [number, number]];
}

export type PlotDimensions = {
  height: number;
  width: number;
  transform: d3.ZoomTransform;
  plotHeight: number,
  plotWidth: number,
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  padding: typeof padding,
}

type DimensionsRef = DimensionsArgs & {
  dimensions: PlotDimensions | null;
}


export function useDimensions(args: DimensionsArgs) {
  const ref = useRef<DimensionsRef>({
    ...args,
    dimensions: null,
  })

  const update = (
    ref.current.dimensions === null ||
    ref.current.height !== args.height ||
    ref.current.width !== args.width ||
    ref.current.transform !== args.transform
  )

  if (update) {
    const { height, width, abundanceLimits, transform } = args
        , plotHeight = height! - padding.t - padding.b
        , plotWidth = width! - padding.l - padding.r
        , [ xDomain, yDomain ] = abundanceLimits

    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, plotWidth])

    const yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([plotHeight, 0])

    ref.current!.dimensions = {
      height,
      width,
      plotHeight,
      plotWidth,
      xScale: transform.rescaleX(xScale),
      yScale: transform.rescaleY(yScale),
      transform,
      padding,
    }
  }

  return ref.current!.dimensions!
}
