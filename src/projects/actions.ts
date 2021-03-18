
import { createAsyncThunk, createAction } from '@reduxjs/toolkit'

import {
  DredgeConfig,
  ProjectSource,
  ThunkConfig,
} from '../ts_types'

export const loadProjectConfig = createAsyncThunk<
  { config: DredgeConfig },
  { source: ProjectSource },
  ThunkConfig
>('load-project', async (args, { getState }) => {
  const { source } = args
      , project = getState().projects[source.key]

  if ('config' in project) {
    return { config: project.config }
  }

  // We should only be dealing with the global config at this point, because
  // the local one is set beforehand. But maybe we want to support loading
  // arbitrary remote projects at some point (again, lol). In that case, the
  // global project would not be assumed.
  const configURL = new URL('./project.json', window.location.toString()).href
})
