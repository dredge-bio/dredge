import h from 'react-hyperscript'
import * as R from 'ramda'
import * as React from 'react'
import { FixedSizeList as List } from 'react-window'

import { useResizeCallback } from '@dredge/main'

import {
  TableSortOrder
} from '../../types'

import {
  TableWrapper,
  TableHeaderCell,
  TableHeaderWrapper,
  TableHeaderRow,
  TableBodyWrapper
} from './Elements'

const { useState, useEffect } = React

const DEFAULT_ROW_HEIGHT = 28

type DimensionState = null | {
  height: number;
  width: number;
  widthWithScrollbar: number;
}

export type TableColumn<Context, ItemData, SortPath> = {
  key: string;
  label: string | ((context: Context) => string);
  width: number;
  borderLeft?: boolean;
  sort: null | {
    key: SortPath;
    active: (context: Context) => boolean;
  };
  renderRow: (data: ItemData, index: number) => React.ReactNode;
}

type TableData<Context, ItemData, SortPath> = {
  context: Context;
  getColumns: (totalWidth: number, context: Context) => TableColumn<Context, ItemData, SortPath>[];
  itemCount: number,
  itemData: ItemData;
  sortOrder: TableSortOrder;
  updateSort: (sortPath: SortPath, order: TableSortOrder) => void;

  onRowEnter?: (data: ItemData, index: number) => void;
  onRowLeave?: (data: ItemData, index: number) => void;

  rowHeight?: number;
  renderHeaderRows?: (
    columns: (TableColumn<Context, ItemData, SortPath> & { left: number })[],
    context: Context
  ) => React.ReactNode[];

}

type RowProps<Context, ItemData, SortPath> = {
  data: {
    data: ItemData;
    columns: (TableColumn<Context, ItemData, SortPath> & { left: number })[];
    onRowEnter?: (data: ItemData, index: number) => void;
    onRowLeave?: (data: ItemData, index: number) => void;
  },
  index: number;
  style: React.CSSProperties;
}

type CellProps = React.PropsWithChildren<{
  left: number;
  width: number;
}>

function TableCell(props: CellProps) {
  const { children, left, width } = props

  return (
    React.createElement('div', {
      style: {
        position: 'absolute',
        left,
        width,
      },
    }, children)
  )
}


function TableRow<Context, ItemData, SortPath>(props: RowProps<Context, ItemData, SortPath>) {
  const {
    style,
    data: {
      data,
      columns,
      onRowEnter,
      onRowLeave,
    },
    index,
  } = props

  return (
    React.createElement('div', {
      onMouseEnter: onRowEnter && (() => onRowEnter(data, index)),
      onMouseLeave: onRowLeave && (() => onRowLeave(data, index)),
      style,
    }, (columns || []).map(column => (
      React.createElement(TableCell, {
        key: column.key,
        left: column.left,
        width: column.width,
      }, column.renderRow(data, index))
    )))
  )
}

export function makeGenericTable<Context, ItemData, SortPath>() {
  return function Table(props: TableData<Context, ItemData, SortPath>) {
    const {
      getColumns,
      context,
      renderHeaderRows,
      rowHeight=DEFAULT_ROW_HEIGHT,
      itemData,
      itemCount,
      onRowEnter,
      onRowLeave,
    } = props

    const [ dimensions, setDimensions ] = useState<DimensionState>(null)
        , [ columns, setColumns ] = useState<(TableColumn<Context, ItemData, SortPath> & { left: number })[] | null>(null)

    const ref = useResizeCallback(el => {
      const tableEl = el.querySelector('.table-scroll')! as HTMLDivElement

      const dims = {
        height: tableEl.clientHeight,
        width: tableEl.clientWidth,

        // FIXME: is this right?
        widthWithScrollbar: tableEl.offsetWidth,
      }

      setDimensions({ ...dims })
    })

    useEffect(() => {
      if (!dimensions) return

      const columns = getColumns(dimensions.width, props.context)

      const columnsWithWidths = columns.map((column, i, columns) => ({
        ...column,
        left: R.sum(columns.slice(0, i).map(col => col.width)),
      }))

      setColumns(columnsWithWidths)
    }, [ dimensions, context  ])

    const additionalRows = renderHeaderRows && columns &&
      renderHeaderRows(columns, context) || []

    return (
      h(TableWrapper, { ref }, [

        h(TableHeaderWrapper, {
          rowHeight,
          numRows: additionalRows.length + 1,
        }, [
          ...additionalRows.map((node, i) =>
            React.createElement(TableHeaderRow, {
              rowHeight,
              key: `table-row-${i}`,
            }, node)
          ),

          h(TableHeaderRow, {
            rowHeight,
            key: 'column-headers',
          }, columns && columns.map(col =>
              h(TableHeaderCell, {
                key: col.key,
                left: col.left,
                clickable: col.sort !== null,
                onClick: () => {
                  if (!col.sort) return

                  const active = col.sort.active(props.context)
                      , nextOrder = (active && props.sortOrder === 'asc') ? 'desc' : 'asc'

                  props.updateSort(col.sort.key, nextOrder)

                },
              }, [

                typeof col.label === 'string'
                  ? col.label
                  : col.label(props.context),

                col.sort === null ? null : (() => {
                  const active = col.sort.active(props.context)

                  if (!active) return null

                  return (
                    h('span', {
                      style: {
                        position: 'relative',
                        fontSize: 10,
                        top: -1,
                        left: 1,
                      },
                    }, props.sortOrder === 'asc' ? ' ▾' : ' ▴')
                  )
                })(),
              ])
           )),

        ]),

        h(TableBodyWrapper, {
          rowHeight,
          numRows: additionalRows.length + 1,
          className: 'table-scroll',
          tableWidthSet: dimensions !== null,
        }, [
          dimensions && React.createElement(List, {
            itemCount,
            itemData: {
              onRowEnter,
              onRowLeave,
              data: itemData,
              columns,
            },
            itemSize: 24,

            height: dimensions.height,
            width: dimensions.widthWithScrollbar,

            children: TableRow,
          }),
        ]),

        h('div.borders', {
        }, columns && columns.map(col =>
          !col.borderLeft ? null : (
            h('span', {
              style: {
                position: 'absolute',
                left: col.left - 8,
                top: 0,
                bottom: 0,
                borderLeft: '1px solid #ccc',
              },
            })
          )
        )),


      ])
    )
  }
}
