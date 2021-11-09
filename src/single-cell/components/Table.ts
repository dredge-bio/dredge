import { createElement as h, useEffect } from 'react'
import styled from 'styled-components'

import {
  makeGenericTable,
  TableColumn
} from '@dredge/shared'

import { formatNumber } from '@dredge/main'

import { useView, useViewDispatch, useViewOptions } from '../hooks'
import * as viewActions from '../actions'

import {
  SingleCellSortPath,
  SingleCellViewState,
  TranscriptImageMap
} from '../types'

type TableData = {
  displayedTranscripts: SingleCellViewState["displayedTranscriptsWithClusters"];
  focusedTranscript: SingleCellViewState["focusedTranscript"];
  selectedTranscripts: SingleCellViewState["selectedTranscripts"];
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
  const { selectedClusters, project } = view

  const getItem = (data: TableData, index: number) =>
    data.displayedTranscripts[index]!

  const displayClusters = selectedClusters.size
    ? [...selectedClusters]
    : [...project.data.clusters.keys()]

  const clusterColumns: Column[] = displayClusters.flatMap(clusterName => [
    {
      key: `cluster-${clusterName}`,
      label: 'logFC',
      width: 72,
      sort: sortFor(clusterName, 'logFC'),
      borderLeft: true,
      renderRow(data: TableData, index: number) {
        const item = getItem(data, index)

        const dge = item.dgeByCluster.get(clusterName)

        return dge ? formatNumber(dge.logFC) : null
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

        return item.transcript.label
      },
    } as Column,

    ...clusterColumns,
  ]
}

export default function SingleCellTable() {
  const view = useView()
      , dispatch = useViewDispatch()
      , [ options, setOptions ] = useViewOptions()
      , { selectedTranscripts, focusedTranscript, project } = view
      , { transcriptImages } = project.data
      , displayedTranscripts = view.displayedTranscriptsWithClusters

  useEffect(() => {
    dispatch(viewActions.setViewSort({
      path: options.sortBy,
      order: options.sortOrder,
    }))
  }, [])

  return (
    h('div', {
      style: {
        height: '100%',
        position: 'relative',
      },
    }, ...[
      h(Table, {
        rowHeight: 26,
        renderHeaderRows(columns, context) {
          const { selectedClusters } = context
              , clusterMap = context.project.data.clusters

          const selectedClustersArr = selectedClusters.size
            ? [...selectedClusters]
            : [...clusterMap.keys()]

          const clusterColumns = columns.slice(2)
            .filter((col, i) => i % 2 === 0)
            .map((col, i) => ({
              ...col,
              cluster: clusterMap.get(selectedClustersArr[i]!),
            }))

          return [
            h('div', null, clusterColumns.map(column =>
              column.cluster && h('div', {
                key: column.cluster.id,
                style: {
                  padding: '0 6px',
                  fontWeight: 'bold',
                  position: 'absolute',
                  borderLeft: column.borderLeft ? '1px solid #ccc' : undefined,
                  left: column.left,
                },
              }, column.cluster.label)
            )),
          ]
        },
        updateSort(path, order) {
          setOptions({
            sortBy: path,
            sortOrder: order,
          })
          dispatch(viewActions.setViewSort({ path, order }))
        },
        rowClassName(data, index) {
          const { transcript } = data.displayedTranscripts[index]!

          let className = 'sc-table-row'

          if (data.selectedTranscripts.has(transcript.id)) {
            className += ' sc-table-row__focused'
          }

          return className
        },
        onRowClick(data, index, e) {
          const { ctrlKey } = e
              , { selectedTranscripts } = data
              , { transcript } = data.displayedTranscripts[index]!

          let nextFocusedTranscript: string | null = transcript.id
            , nextSelectedTranscripts = new Set(selectedTranscripts)

          if (ctrlKey) {
            if (selectedTranscripts.has(transcript.id)) {
              nextSelectedTranscripts.delete(transcript.id)

              const focusNext = Array.from(nextFocusedTranscript).slice(-1)[0]

              if (focusNext) {
                nextFocusedTranscript = focusNext
              } else {
                nextFocusedTranscript = null
              }
            } else {
              nextSelectedTranscripts.add(transcript.id)
            }
          } else {
            if (selectedTranscripts.has(transcript.id)) {
              nextSelectedTranscripts = new Set()
              nextFocusedTranscript = null
            } else {
              nextSelectedTranscripts = new Set([transcript.id])
            }
          }

          dispatch(viewActions.setFocusedTranscript({ transcript: nextFocusedTranscript }))
          dispatch(viewActions.setSelectedTranscripts({ transcripts: nextSelectedTranscripts }))

          setOptions({
            selectedTranscripts: nextSelectedTranscripts,
          })
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
          transcriptImages,
          focusedTranscript,
          selectedTranscripts,
        },
        itemCount: displayedTranscripts.length,
      }),
    ])
  )
}
