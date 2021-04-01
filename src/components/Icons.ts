import h from 'react-hyperscript'
import * as React from 'react'

export type IconProps = React.PropsWithChildren<{
  stroke?: string;
  strokeWidth?: number | string;
  height?: number;
  width?: number;
  children?: React.ReactNode;
}>

function withDefaults(props: IconProps): Required<Omit<IconProps, 'children'>> {
  const {
    stroke='black',
    strokeWidth=2,
    height=16,
    width=16,
  } = props

  return {
    stroke,
    strokeWidth,
    height,
    width,
  }
}

export function MagnifyingGlass(props: IconProps) {
  const {
    stroke,
    strokeWidth,
    height,
    width,
  } = withDefaults(props)

  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 24 24',
      stroke,
      strokeWidth,
      fill: 'none',
    }, [
      h('circle', {
        cx: 9,
        cy: 9,
        r: 8,
      }),
      h('line', {
        x1: 23,
        y1: 23,
        x2: 14.65,
        y2: 14.65,
      }),
    ])
  )
}

export function Target (props: IconProps) {
  const {
    stroke,
    strokeWidth,
    height,
    width,
  } = withDefaults(props)

  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 24 24',
      stroke,
      strokeWidth,
      fill: 'none',
    }, [
      h('line', {
        x1: 12,
        y1: 1,
        x2: 12,
        y2: 8,
      }),

      h('line', {
        x1: 12,
        y1: 16,
        x2: 12,
        y2: 23,
      }),

      h('line', {
        x1: 1,
        y1: 12,
        x2: 8,
        y2: 12,
      }),

      h('line', {
        x1: 16,
        y1: 12,
        x2: 23,
        y2: 12,
      }),

    ])
  )
}

export function Pointer (props: IconProps) {
  const {
    stroke,
    strokeWidth,
    height,
    width,
  } = withDefaults(props)

  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 100 100',
      stroke,
      strokeWidth,
      fill: 'none',
    }, [
      h('g', {
        transform: 'scale(1.6)',
      }, [
        h('g', {
          transform: 'translate(-16,-972.36218)',
        }, [
          h('path', {
            d: `
      m 28.808076,973.90051 a 1.0001,1.0001 0 0 0 -0.8125,1.09375 l 5.625,51.78134 a 1.0001,1.0001 0 0 0 1.8125,0.4687 l 8.75,-12.0313 8.75,15.1251 a 1.0001,1.0001 0 0 0 1.34375,0.375 l 10.40625,-6 a 1.0001,1.0001 0 0 0 0.375,-1.375 l -8.71875,-15.0938 14.75,-1.5938 a 1.0001,1.0001 0 0 0 0.5,-1.8125 l -42.03125,-30.74999 a 1.0001,1.0001 0 0 0 -0.75,-0.1875 z m 1.40625,3.125 38.09375,27.90629 -13.75,1.4687 a 1.0001,1.0001 0 0 0 -0.75,1.5 l 9,15.5938 -8.65625,5 -9,-15.5938 a 1.0001,1.0001 0 0 0 -1.6875,-0.094 l -8.125,11.1563 -5.125,-46.93754 z
            `,
          }),
        ]),
      ]),
    ])
  )
}

export function Reset (props: IconProps) {
  const {
    stroke,
    strokeWidth,
    height,
    width,
  } = withDefaults(props)

  return (
    h('svg', {
      width,
      height,
      viewBox: '0 0 24 24',
      stroke,
      strokeWidth,
      fill: 'none',
    }, [
      h('path', {
        d: 'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38',
      }),
    ])
  )
}
