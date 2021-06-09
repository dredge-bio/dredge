import h from 'react-hyperscript'

import makeGenericTable, { TableColumn } from './GenericTable'
import { useView } from '../../view/hooks'
import { useAppDispatch } from '../../hooks'
import { actions as viewActions } from '../../view'

import {
  SingleCellSortPath,
  TableSortOrder,
  SingleCellViewState
} from '../../types'

type TableData = {
  displayedTranscripts: SingleCellViewState["displayedTranscriptsWithClusters"]
}

const Table = makeGenericTable<SingleCellViewState, TableData, SingleCellSortPath>()

type Column = TableColumn<SingleCellViewState, TableData, SingleCellSortPath>

function sortFor(
  clusterKey: string,
  valueType: 'p-value' | 'logFC'
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
      sort: sortFor(clusterName, 'p-value'),
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
          }, item.transcript.split('|', 2)[1]!)
        )
      },
    } as Column,

    ...clusterColumns,
  ]
}

export default function SingleCellTable() {
  const view = useView('SingleCell')
      , dispatch = useAppDispatch()

  const displayedTranscripts = view.displayedTranscriptsWithClusters

  return (
    h(Table, {
      rowHeight: 40,
      updateSort(key, order) {
        // FIXME
        key;
        order;
      },
      onRowEnter(data, index) {
        const { transcript } = data.displayedTranscripts[index]!

        dispatch(viewActions.setHoveredTranscript({
          transcript: transcript.split('|', 2)[1]!,
        }))
      },
      onRowLeave() {
        dispatch(viewActions.setHoveredTranscript({
          transcript: null,
        }))
      },
      sortOrder: 'asc' as TableSortOrder,
      context: view,
      getColumns,
      itemData: {
        displayedTranscripts,
      },
      itemCount: displayedTranscripts.length,
    })
  )
}
