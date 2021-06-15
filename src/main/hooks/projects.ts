import {
  ProjectSource,
  ProjectType,
  LoadedProject,
  SingleCellProject,
  BulkProject
} from '../types'

import { useAppSelector } from './store'

export function useProject(source: ProjectSource, type?: 'SingleCell'): SingleCellProject;
export function useProject(source: ProjectSource, type?: 'Bulk'): BulkProject;
export function useProject(source: ProjectSource, type?: ProjectType): LoadedProject {
  const project = useAppSelector(state => state.projects[source])

  if (!project || 'failed' in project || 'loaded' in project) {
    throw new Error(`Project ${source} is not yet loaded`)
  }

  if (type === undefined) {
    return project
  }

  if (type === 'SingleCell' && project.type === 'SingleCell') {
    return project
  } else if (type === 'Bulk' && project.type === 'Bulk') {
    return project
  } else {
    throw new Error(
      `Requested project type is ${type}, but project ${source} is of type ${project.type}`)
  }
}
