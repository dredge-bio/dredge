import h from 'react-hyperscript'
import LoadingIndicator from './Loading'
import PlotWrapper from './Outer'

import { useAppSelector, useSized } from '../../hooks'

export default function PlotContainer() {
  const [ ref, rect ] = useSized()

  const { isLoading, key } = useAppSelector(state => {
    const view = state.view!.default

    return {
      key: view.source.key,
      isLoading: view.loading,
    }
  })

  return (
    h('div', {
      ref,
      style: {
        height: '100%',
        position: 'relative',
      },
    }, [
      rect === null ? null : h(PlotWrapper, {
        key,
        height: rect.height,
        width: rect.width,
      }),

      h(LoadingIndicator, {
        loading: isLoading,
      }),
    ])
  )
}
