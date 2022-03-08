import * as React from 'react'

const { useCallback, useState } = React

type NodeCallback = (node: HTMLElement) => void

export function useNode(nodeCB: NodeCallback) {
  let cb: () => void | undefined

  const ref = useCallback((node: HTMLElement | null) => {
    if (node) {
      cb = () => { nodeCB(node) }

      cb()
    }
  }, [])

  return ref
}

type RectState = null | {
  height: number;
  width: number;
}

export function useSized(): [ ReturnType<typeof useNode>, RectState ] {
  const [ rect, setRectState ] = useState<RectState>(null)

  const ref = useNode(node => {
    setRectState({
      height: node.clientHeight,
      width: node.clientWidth,
    })
  })

  return [ ref, rect ]
}
