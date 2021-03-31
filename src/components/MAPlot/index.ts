"use strict";

import h from 'react-hyperscript'
import * as R from 'ramda'
import * as React from 'react'
import LoadingIndicator from './Loading'
import PlotWrapper from './Outer'

import { useAppSelector, useSized } from '../../hooks'

const { useState } = React

type RectState = {
  height: number | null;
  width: number | null;
}

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
