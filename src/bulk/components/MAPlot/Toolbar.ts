import h from 'react-hyperscript'
import styled from 'styled-components'
import { Button, Flex } from 'rebass'
import { MagnifyingGlass, Target, Reset } from '../Icons'
import * as d3 from 'd3'
import * as React from 'react'

import padding from './padding'
import { InteractionAction } from './types'

export const help = {
  zoom: 'Use mouse/touchscreen to zoom and pan',
  select: 'Use mouse to select squares on the plot',
  brush: 'Use mouse/touchscreen to select an area on the plot',
  reset: 'Reset position of the plot',
}

export type HelpOptions = keyof typeof help

const { useState } = React

const HelpText = styled.p<{
  padding: typeof padding
}>`
  position: absolute;
  left: ${props => props.padding.l + 16 }px;
  right: ${props => props.padding.r + 16 }px;
  top: ${props => props.padding.t + 8 }px;
  padding: .66rem;
  background-color: hsl(205,35%,85%);
  border: 1px solid hsl(205,35%,45%);
  text-align: center;
`

const ButtonGroup = styled.div`
display: flex;

button {
  border-radius: 0;
}

button:last-of-type {
  border-radius: 0 4px 4px 0;
}

button:first-of-type {
  border-radius: 4px 0 0 4px;
}

button + button {
  margin-left: -1px;
}
`

const ToolbarButton = styled(Button)<{
  ['data-active']: boolean
}>`
&[data-active] {
  position: relative;
}

&[data-active]:focus {
  z-index: 1;
}

&[data-active="true"]::after {
  position: absolute;
  content: " ";
  left: 4px;
  right: 4px;
  height: 2px;
  background-color: hsl(205,35%,45%);
  bottom: -8px;
  border: 1px solid #eee;
  box-shadow: 0 0 0 1px #eee;
}
`

type ToolbarProps = {
  interactionType: InteractionAction;
  setInteractionType: (type: InteractionAction) => void;
  resetBrush: () => void;
  transform: d3.ZoomTransform;
  setTransform: (transform: d3.ZoomTransform) => void;
}

export default function Toolbar(props: ToolbarProps) {
  const {
    interactionType,
    setInteractionType,
    resetBrush,
    transform,
    setTransform,
  } = props

  const [ showHelp, setShowHelp ] = useState<HelpOptions | null>(null)

  return (
    h('div', [
      showHelp && (
        h(HelpText, {
          padding,
        }, help[showHelp])
      ),
      h('div', {
        style: {
          position: 'absolute',
          right: padding.r,
          top: 6,
          width: 146,
          height: padding.t - 6,
          background: '#eee',
          border: '1px solid #ccc',
          borderRadius: '4px 4px 0 0',
          borderBottom: 'none',
        },
      }, [
        h(Flex, {
          className: 'toolbar',
          p: 2,
        }, [
          h(ButtonGroup, [
            h(ToolbarButton, {
              onClick: () => {
                setInteractionType('brush')
              },
              onMouseEnter: () => {
                setShowHelp('brush')
              },
              onMouseLeave: () => {
                setShowHelp(null)
              },
              ['data-active']: interactionType === 'brush',
            }, h(Target)),
            h(ToolbarButton, {
              onClick: () => {
                setInteractionType('zoom')
              },
              onMouseEnter: () => {
                setShowHelp('zoom')
              },
              onMouseLeave: () => {
                setShowHelp(null)
              },
              ['data-active']: interactionType === 'zoom',
            }, h(MagnifyingGlass)),
          ]),
          h(Button, {
            ml: 1,
            onMouseEnter: () => {
                setShowHelp('reset')
            },
            onMouseLeave: () => {
                setShowHelp(null)
            },
            onClick: () => {
              resetBrush()

              if (transform === d3.zoomIdentity) return

              setTransform(d3.zoomIdentity)
            },
          }, h(Reset)),
        ]),
      ]),
    ])
  )
}
