import { createElement as h } from 'react'
import styled from 'styled-components'
import { Button, ButtonProps } from 'rebass'
import { useViewOptions } from '../hooks'
import TranscriptInfo from './TranscriptInfo'
import ClusterLegend from './ClusterLegend'

const Container = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 100%;

  .pane-select-buttons {
    display: flex;
    flex-direction: column;
    padding: 1em 15px 1em 10px;
    background: #f0f0f0;
    border-right: 1px solid #999;

    button {
      margin-bottom: 8px;
      position: relative;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      width: 2.5em;
    }

    button span {
      writing-mode: vertical-lr;
      transform: rotate(180deg);
    }

    button[data-selected=true]::after {
      position: absolute;
      content: " ";
      left: calc(100% + 4px);

      background-color: hsl(205,35%,25%);
      height: 8px;
      width: 8px;
      border-radius: 8px;

      display: flex;
      align-items: center;
    }
  }
`

const SelectorButton: React.FunctionComponent<ButtonProps & {
  ['data-selected']: boolean
}> = Button

export default function WindowSelector() {
  const [ options, updateOptions ] = useViewOptions()

  let infoComponent: React.ReactElement

  if (options.showWindow === 'images') {
    infoComponent = h(TranscriptInfo)
  } else {
    infoComponent = h(ClusterLegend)
  }

  return (
    h(Container, null, ...[
      h('div', {
        className: 'pane-select-buttons',
      }, ...[
        h(SelectorButton, {
          ['data-selected']: options.showWindow === 'images',
          onClick() {
            updateOptions({
              showWindow: 'images',
            })
          },
        }, h('span', null, 'Transcript images')),
        h(SelectorButton, {
          ['data-selected']: options.showWindow === 'clusters',
          onClick() {
            updateOptions({
              showWindow: 'clusters',
            })
          },
        }, h('span', null, 'Cluster legend')),
      ]),

      h('div', null, infoComponent),
    ])
  )
}
