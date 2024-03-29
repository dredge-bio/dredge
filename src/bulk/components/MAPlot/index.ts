import { createElement as h } from 'react'
import LoadingIndicator from './Loading'
import PlotWrapper from './Outer'

import { useView } from '../../hooks'
import { useSized } from '@dredge/main'

type PlotContainerProps = {
  onBrush: (extend: [number, number, number, number] | null) => void
  persistBrush: (extend: [number, number, number, number] | null) => void
}

export default function PlotContainer(props: PlotContainerProps) {
  const [ ref, rect ] = useSized()
      , view = useView()
      , key = view.project.source
      , isLoading = view.loading

  return (
    h('div', {
      ref,
      style: {
        height: '100%',
        position: 'relative',
      },
    }, ...[
      rect === null ? null : h(PlotWrapper, {
        key,
        onBrush: props.onBrush,
        persistBrush: props.persistBrush,
        height: rect.height,
        width: rect.width,
      }),

      h(LoadingIndicator, {
        loading: isLoading,
      }),
    ])
  )
}
