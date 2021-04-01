import h from 'react-hyperscript'
import styled from 'styled-components'

import { useViewProject } from '../../view'

export type TooltipPosition = 'top' | 'bottom'

type TooltipPositionProps  = {
  position: TooltipPosition;
}

type TooltipProps = TooltipPositionProps & {
  treatment: string | null;
}

const TooltipContainer = styled.div<TooltipPositionProps>`
  position: absolute;
  z-index: 1;

  left: 0;
  right: 0;
  ${ props => props.position === 'bottom' ? 'top: 100%;' : 'bottom: 100%;' }

  text-align: center;
  font-weight: bold;

  & span {
    display: inline-block;
    padding: .75rem 1.5rem;

    min-width: 200px;
    background: #fafafa;

    border: 1px solid #ccc;
    borderRadius: 4px;
  }
`

export default function Tooltip(props: TooltipProps) {
  const { position, treatment } = props
      , project = useViewProject()
      , { treatments } = project.data

  if (!treatment) return null

  const projectTreatment = treatments.get(treatment)

  if (!projectTreatment) return null

  return (
    h(TooltipContainer, { position }, [
      h('span', projectTreatment.label),
    ])
  )
}
