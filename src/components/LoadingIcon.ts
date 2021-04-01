import h from 'react-hyperscript'
import * as React from 'react'
import { IconProps } from './Icons'

export default function LoadingIcon (props: IconProps) {
  const {
    stroke='black',
    width=12,
    strokeWidth='2px',
  } = props

  return (
    h('svg', {
      width,
      viewBox: '0 0 20 20',
    }, [
      h('line', {
        stroke,
        strokeWidth,
        x1: 0,
        y1: 10,
        x2: 20,
        y2: 10,
      }, [
        React.createElement('animateTransform', {
          attributeName: 'transform',
          type: 'rotate',
          from: '0 10 10',
          to: '360 10 10',
          dur: '1.2s',
          repeatCount: 'indefinite',
        }),
      ]),
    ])
  )
}
