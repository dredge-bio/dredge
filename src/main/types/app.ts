import { ORGShellResource } from 'org-shell'
import { AppDispatch, AppState } from '../store'

export type DredgeState = AppState

export type ThunkConfig = {
  state: DredgeState;
}

export interface Resource extends ORGShellResource<{
  dispatch: AppDispatch,
  getState: () => AppState,
}> {
  makeTitle?: (state: DredgeState) => string;
  absoluteDimensions?: boolean;
}
