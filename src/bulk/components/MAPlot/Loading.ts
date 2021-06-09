import h from 'react-hyperscript'
import styled from 'styled-components'
import * as React from 'react'

const { useRef, useEffect, useState } = React

const LoadingWrapper = styled.div`
  position: absolute;
  color: red;
  font-size: 64px;
  top: 20%;
  left: 50%;
  transform: translate(-50%,0);
`

type LoadingProps = {
  loading: boolean;
}

const TIMER_SHOWN_TIME = 300

export default function LoadingIndicator(props: LoadingProps) {
  const { loading } = props
      , [ showTimer, setShowTimer ] = useState(false)
      , timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!loading) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setShowTimer(true)

    const timer = setTimeout(() => {
      setShowTimer(false)
    }, TIMER_SHOWN_TIME)

    timerRef.current = timer
  }, [ loading ])

  if (!showTimer) return null

  return (
    h(LoadingWrapper, [
      'Loading.....',
    ])
  )
}
