import h from 'react-hyperscript'
import * as React from 'react'
import * as R from 'ramda'

import makeGenericTable, { TableColumn } from './GenericTable'
import { useView, useComparedTreatmentLabels } from '../../view/hooks'
import { useAppDispatch } from '../../hooks'
import { actions as viewActions } from '../../view'

import {
  TableSortOrder,
  SingleCellViewState,
  BulkDifferentialExpression,
  BulkDisplayedTranscriptsSource,
} from '../../types'

type TableData = {
  displayedTranscripts: SingleCellViewState["displayedTranscriptsWithClusters"]
}

const Table = makeGenericTable<SingleCellViewState, TableData>()

function getColumns(width: number, view: SingleCellViewState): TableColumn<SingleCellViewState, TableData>[] {
  const { selectedClusters, displayedTranscriptsWithClusters } = view

  const getItem = (data: TableData, index: number) =>
    data.displayedTranscripts[index]!

  const clusterRows = [...(selectedClusters || [])].map(clusterName => ({
    key: `cluster-${clusterName}`,
    label: clusterName,
    width: 120,
    sort: null,
    borderLeft: true,
    renderRow(data: TableData, index: number) {
      const item = getItem(data, index)

      const dge = item.dgeByCluster.get(clusterName)

      return dge ? dge.logFC : null
    }
  }))


  return [
    {
      key: 'transcript',
      label: 'Transcript',
      width: 180,
      sort: null,
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)

        return (
          h('span', {
            style: {
              paddingLeft: '4px',
            },
          }, item.transcript.split('|', 2)[1]!)
        )
      }
    },

    ...clusterRows,
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
