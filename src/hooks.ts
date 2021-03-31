import * as React from 'react'
import { TypedUseSelectorHook, useSelector } from 'react-redux'

import { useAppDispatch } from './store'
import { DredgeState } from './types'

const { useCallback, useState } = React

export const useAppSelector: TypedUseSelectorHook<DredgeState> = useSelector
export { useAppDispatch }

type ResizeCallback = (node: HTMLElement) => void

export function useResizeCallback(onResize: ResizeCallback) {
  let cb: () => void | undefined

  const ref = useCallback((node: HTMLElement | null) => {
    if (node) {
      cb = () => { onResize(node) }

      cb()
      window.addEventListener('application-resize', cb)
    } else {
      window.removeEventListener('application-resize', cb)
    }
  }, [])

  return ref
}

type RectState = null | {
  height: number;
  width: number;
}

export function useSized(): [ ReturnType<typeof useResizeCallback>, RectState ] {
  const [ rect, setRectState ] = useState<RectState>(null)

  const ref = useResizeCallback(node => {
    setRectState({
      height: node.clientHeight,
      width: node.clientWidth,
    })
  })

  return [ ref, rect ]
}
