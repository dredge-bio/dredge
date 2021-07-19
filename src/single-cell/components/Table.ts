import h from 'react-hyperscript'
import styled from 'styled-components'

import {
  makeGenericTable,
  TableColumn
} from '@dredge/shared'

import { formatNumber } from '@dredge/main'

import { useView, useViewDispatch } from '../hooks'
import * as viewActions from '../actions'

import {
  SingleCellSortPath,
  SingleCellViewState,
  TranscriptImageMap
} from '../types'

type TableData = {
  displayedTranscripts: SingleCellViewState["displayedTranscriptsWithClusters"];
  focusedTranscript: SingleCellViewState["focusedTranscript"];
  transcriptImages: TranscriptImageMap;
}

const TableComponent = makeGenericTable<SingleCellViewState, TableData, SingleCellSortPath>()

const Table = styled(TableComponent)`

  .sc-table-row:hover,
  .sc-table-row__focused {
    background: #f0f0f0;
  }
`

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

  if (!displayClusters.length) {
    return []
  }

  const clusterColumns: Column[] = displayClusters.flatMap(clusterName => [
    {
      key: `cluster-${clusterName}`,
      label: clusterName,
      width: 72,
      sort: sortFor(clusterName, 'logFC'),
      borderLeft: true,
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)

        const dge = item.dgeByCluster.get(clusterName)

        return (
          h('span', {
            style: {
              display: 'inline-block',
            },
          }, dge ? formatNumber(dge.logFC) : null)
        )
      },
    },
    {
      key: `cluster-${clusterName}-pvalue`,
      label: 'p',
      width: 60,
      sort: sortFor(clusterName, 'pValue'),
      borderLeft: false,
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)

        const dge = item.dgeByCluster.get(clusterName)

        return dge ? formatNumber(dge.pValue) : null
      },
    } as Column,
  ])


  return [
    {
      key: 'insitu',
      label: '📷',
      width: 42,
      sort: {
        key: 'hasInsitu',
        active: view => view.sortPath === 'hasInsitu',
      },
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)
            , hasInsitu = data.transcriptImages.has(item.transcript.id)

        return (
          h('span', {
            style: {
              fontSize: '20px',
              marginLeft: '10px',
              display: 'inline-block',
              color: 'blue',
            },
          }, hasInsitu ? '•' : null)
        )
      },
    } as Column,

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
      , { focusedTranscript, project } = view
      , { transcriptImages } = project.data
      , displayedTranscripts = view.displayedTranscriptsWithClusters

  return (
    h('div', {
      style: {
        height: '100%',
        position: 'relative',
      },
    }, [
      h(Table, {
        rowHeight: 40,
        updateSort(path, order) {
          dispatch(viewActions.setViewSort({ path, order }))
        },
        rowClassName(data, index) {
          const { transcript } = data.displayedTranscripts[index]!

          let className = 'sc-table-row'

          if (transcript.id === data.focusedTranscript) {
            className += ' sc-table-row__focused'
          }

          return className
        },
        onRowClick(data, index) {
          const { transcript } = data.displayedTranscripts[index]!

          dispatch(viewActions.setFocusedTranscript({
            transcript: data.focusedTranscript === transcript.id
              ? null
              : transcript.id,
          }))
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
          transcriptImages,
          displayedTranscripts,
          focusedTranscript,
        },
        itemCount: displayedTranscripts.length,
      }),

      displayedTranscripts.length > 0 ? null : (
        h('div', {
          style: {
            position: 'absolute',
            top: '20%',
            left: 0,
            right: 0,

            color: '#666',
            lineHeight: '150%',
            textAlign: 'center',
          },
        }, [
          'Select a cluster to populate transcript table',
          h('br'),
          'Select multiple clusters by holding control or shift while clicking',
        ])
      ),
    ])
  )
}
