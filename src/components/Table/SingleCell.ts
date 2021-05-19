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
}

const Table = makeGenericTable<SingleCellViewState, TableData>()

function getColumns(width: number, view: SingleCellViewState): TableColumn<SingleCellViewState, TableData>[] {
  return [
    {
      key: 'transcript',
      label: 'Transcript',
      width: 180,
      sort: null,
      renderRow(data: TableData, index: number) {
        return (
          1
        )
      }
    },

    {
      key: 'logFC',
      label: 'logFC',
      width: 100,
      sort: null,
      borderLeft: true,
      renderRow(data: TableData, index: number) {
        return (
          2
        )
      }
    },

    {
      key: 'pvalue',
      label: 'p-value',
      width: 100,
      sort: null,
      renderRow(data: TableData, index: number) {
        return (
          2
        )
      }
    },
  ]
}

export default function SingleCellTable() {
  const view = useView('SingleCell')
      , dispatch = useAppDispatch()

  return (
    h(Table, {
      rowHeight: 40,
      updateSort(key, order) {
      },
      sortOrder: 'asc' as TableSortOrder,
      context: view,
      getColumns,
      itemData: {},
      itemCount: 3000,
    })
  )
}
