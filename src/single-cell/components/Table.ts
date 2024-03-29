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

  .transcript-row-hovered,
  .transcript-column-hovered {
    background: #f3f3f3;
  }

  .transcript-row-hovered.transcript-column-hovered {
    background: #ececec;
  }

  .transcript-row-selected {
    background: #ececff;
  }

  .transcript-row-selected.transcript-row-hovered,
  .transcript-row-selected.transcript-column-hovered {
    background: #e3e3ff;
  }

  .transcript-row-hovered.transcript-column-hovered.transcript-row-selected {
    background: #dcdcff;
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
      key: `cluster-${clusterName}-logFC`,
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
        freezeColumns: 2,
        getCellClassname(props) {
          const {
            column,
            mousePosition,
            rowIndex,
            data,
          } = props

          let className = ''

          if (mousePosition) {
            const rowHovered = mousePosition.rowIndex === rowIndex

            const columnHovered = (
              column.key.startsWith('cluster-') &&
              mousePosition.column.key.startsWith('cluster-') &&
              column.key.replace(/logFC|pvalue/, '') === mousePosition.column.key.replace(/logFC|pvalue/, '')
            )

            if (rowHovered) {
              className += ' transcript-row-hovered';
            }

            if (columnHovered) {
              className += ' transcript-column-hovered';
            }

          }

          const rowTranscript = data.displayedTranscripts[rowIndex]!

          const rowSelected = data.selectedTranscripts.has(rowTranscript.transcript.id)

          if (rowSelected) {
            className += ' transcript-row-selected'
          }


          return className
        },
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
              }, column.cluster.id)
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
        onRowClick(data, index) {
          const { selectedTranscripts } = data
              , { transcript } = data.displayedTranscripts[index]!

          let nextFocusedTranscript = transcript.id as string | null

          const nextSelectedTranscripts = new Set(selectedTranscripts)

          if (selectedTranscripts.has(transcript.id)) {
            nextSelectedTranscripts.delete(transcript.id)

            const focusNext = Array.from(nextSelectedTranscripts).slice(-1)[0]

            if (focusNext) {
              nextFocusedTranscript = focusNext
            } else {
              nextFocusedTranscript = null
            }
          } else {
            nextSelectedTranscripts.add(transcript.id)
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
