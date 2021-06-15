import h from 'react-hyperscript'

import {
  makeGenericTable,
  TableColumn
} from '@dredge/shared'

import { useView, useViewDispatch } from '../hooks'
import * as viewActions from '../actions'

import {
  SingleCellSortPath,
  SingleCellViewState
} from '../types'

type TableData = {
  displayedTranscripts: SingleCellViewState["displayedTranscriptsWithClusters"]
}

const Table = makeGenericTable<SingleCellViewState, TableData, SingleCellSortPath>()

type Column = TableColumn<SingleCellViewState, TableData, SingleCellSortPath>

function sortFor(
  clusterKey: string,
  valueType: 'pValue' | 'logFC'
) {
  return {
    key: { cluster: clusterKey, value: valueType },
    active: (view: SingleCellViewState) =>
      typeof view.sortPath === 'object' &&
      view.sortPath.cluster === clusterKey &&
      view.sortPath.value === valueType,
  }
}

function getColumns(width: number, view: SingleCellViewState) {
  const { selectedClusters } = view

  const getItem = (data: TableData, index: number) =>
    data.displayedTranscripts[index]!

  const displayClusters = [...(selectedClusters || [])]

  const clusterColumns: Column[] = displayClusters.flatMap(clusterName => [
    {
      key: `cluster-${clusterName}`,
      label: clusterName,
      width: 120,
      sort: sortFor(clusterName, 'logFC'),
      borderLeft: true,
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)

        const dge = item.dgeByCluster.get(clusterName)

        return dge ? dge.logFC : null
      },
    },
    {
      key: `cluster-${clusterName}-pvalue`,
      label: 'p',
      width: 80,
      sort: sortFor(clusterName, 'pValue'),
      borderLeft: false,
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)

        const dge = item.dgeByCluster.get(clusterName)

        return dge ? dge.pValue : null
      },
    } as Column,
  ])


  return [
    {
      key: 'transcript',
      label: 'Transcript',
      width: 180,
      sort: {
        key: 'transcript',
        active: view => view.sortPath === 'transcript',
      },
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)

        return (
          h('span', {
            style: {
              paddingLeft: '4px',
            },
          }, item.transcript.label)
        )
      },
    } as Column,

    ...clusterColumns,
  ]
}

export default function SingleCellTable() {
  const view = useView()
      , dispatch = useViewDispatch()

  const displayedTranscripts = view.displayedTranscriptsWithClusters

  return (
    h(Table, {
      rowHeight: 40,
      updateSort(path, order) {
        dispatch(viewActions.setViewSort({ path, order }))
      },
      onRowEnter(data, index) {
        const { transcript } = data.displayedTranscripts[index]!

        dispatch(viewActions.setHoveredTranscript({
          transcript: transcript.id,
        }))
      },
      onRowLeave() {
        dispatch(viewActions.setHoveredTranscript({
          transcript: null,
        }))
      },
      sortOrder: view.order,
      context: view,
      getColumns,
      itemData: {
        displayedTranscripts,
      },
      itemCount: displayedTranscripts.length,
    })
  )
}
