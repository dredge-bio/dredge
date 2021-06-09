import { createAction } from '@dredge/main'

export const setHoveredTranscript = createAction<
  { transcript: string | null }
>('set-hovered-transcript')
