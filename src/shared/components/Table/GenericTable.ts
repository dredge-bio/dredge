import { createElement as h } from 'react'
import * as R from 'ramda'
import * as React from 'react'
import { FixedSizeList as List } from 'react-window'

import { useResizeCallback, shallowEquals } from '@dredge/main'

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

const { useRef, useState, useEffect, memo } = React

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
  className?: string;

  context: Context;
  getColumns: (totalWidth: number, context: Context) => TableColumn<Context, ItemData, SortPath>[];
  itemCount: number,
  itemData: ItemData;
  sortOrder: TableSortOrder;
  updateSort: (sortPath: SortPath, order: TableSortOrder) => void;

  rowClassName?: string | ((data: ItemData, index: number) => string);
  onRowClick?: (data: ItemData, index: number, event: MouseEvent) => void;
  onRowEnter?: (data: ItemData, index: number, event: MouseEvent) => void;
  onRowLeave?: (data: ItemData, index: number, event: MouseEvent) => void;

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
    rowClassName?: string | ((data: ItemData, index: number) => string);
    onRowClick?: (data: ItemData, index: number, event: MouseEvent) => void;
    onRowEnter?: (data: ItemData, index: number, event: MouseEvent) => void;
    onRowLeave?: (data: ItemData, index: number, event: MouseEvent) => void;
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


/* eslint-disable-next-line */
const TableRow = memo(function TableRow<Context, ItemData, SortPath>(props: RowProps<Context, ItemData, SortPath>) {
  const {
    style,
    data: {
      data,
      columns,
      rowClassName,
      onRowClick,
      onRowEnter,
      onRowLeave,
    },
    index,
  } = props

  let className: undefined | string

  if (typeof rowClassName === 'string') {
    className = rowClassName
  } else if (rowClassName) {
    className = rowClassName(data, index)
  }

  return (
    React.createElement('div', {
      className,
      onClick: onRowClick && ((e: MouseEvent) => onRowClick(data, index, e)),
      onMouseEnter: onRowEnter && ((e: MouseEvent) => onRowEnter(data, index, e)),
      onMouseLeave: onRowLeave && ((e: MouseEvent) => onRowLeave(data, index, e)),
      style,
    }, (columns || []).map(column => (
      React.createElement(TableCell, {
        key: column.key,
        left: column.left,
        width: column.width,
      }, column.renderRow(data, index))
    )))
  )
}, (prevProps, nextProps) => {
  let oldClassName: string = ''
    , newClassName: string = ''

  if (typeof prevProps.data.rowClassName === 'string') {
    oldClassName = prevProps.data.rowClassName
  } else if (typeof prevProps.data.rowClassName === 'function') {
    oldClassName = prevProps.data.rowClassName(prevProps.data.data, prevProps.index)
  }

  if (typeof nextProps.data.rowClassName === 'string') {
    newClassName = nextProps.data.rowClassName
  } else if (typeof nextProps.data.rowClassName === 'function') {
    newClassName = nextProps.data.rowClassName(nextProps.data.data, nextProps.index)
  }

  return (
    prevProps.index === nextProps.index &&
    R.equals(prevProps.data.columns.map(x => x.key), nextProps.data.columns.map(x => x.key)) &&
    shallowEquals(prevProps.data.data, nextProps.data.data) &&
    oldClassName === newClassName
  )
})

export function makeGenericTable<Context, ItemData, SortPath>() {
  return function Table(props: TableData<Context, ItemData, SortPath>) {
    const {
      className,
      getColumns,
      context,
      renderHeaderRows,
      rowHeight=DEFAULT_ROW_HEIGHT,
      itemData,
      itemCount,
      rowClassName,
      onRowClick,
      onRowEnter,
      onRowLeave,
    } = props

    const [ dimensions, setDimensions ] = useState<DimensionState>(null)
        , [ columns, setColumns ] = useState<(TableColumn<Context, ItemData, SortPath> & { left: number })[] | null>(null)
        , [ headerOffsetLeft, setHeaderOffsetLeft ] = useState(0)
        , [ headerWidth, setHeaderWidth ] = useState<string | number>('100%')

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

    const listRef = useRef<HTMLDivElement>()

    useEffect(() => {
      const el = listRef.current

      if (!el) return

      const scrollEl = el.parentNode! as HTMLDivElement

      scrollEl.addEventListener('scroll', () => {
        setHeaderOffsetLeft(scrollEl.scrollLeft)
      })
    }, [listRef.current])

    useEffect(() => {
      if (!dimensions) return

      const columns = getColumns(dimensions.width, props.context)

      const columnsWithWidths = columns.map((column, i, columns) => ({
        ...column,
        left: R.sum(columns.slice(0, i).map(col => col.width)),
      }))

      setColumns(columnsWithWidths)
    }, [ dimensions, context  ])

    useEffect(() => {
      if (!dimensions || !columns) {
        setHeaderWidth('100%')
        return
      }

      let headerWidth = R.sum(columns.map(col => col.width))

      if (dimensions.widthWithScrollbar > headerWidth) {
        headerWidth = dimensions.widthWithScrollbar
      }

      setHeaderWidth(headerWidth)
    }, [ dimensions, columns ])

    const additionalRows = renderHeaderRows && columns &&
      renderHeaderRows(columns, context) || []

    return (
      h(TableWrapper, {
        className,
        ref,
      }, ...[
        h(TableHeaderWrapper, {
          rowHeight,
          numRows: additionalRows.length + 1,
          offsetLeft: headerOffsetLeft,
          totalWidth: headerWidth,
        }, [
          ...additionalRows.map((node, i) =>
            h(TableHeaderRow, {
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
              }, ...[

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
        }, ...[
          dimensions && React.createElement(List, {
            innerRef: listRef,
            overscanCount: 50,
            itemCount,
            itemData: {
              onRowClick,
              onRowEnter,
              onRowLeave,
              rowClassName,
              data: itemData,
              columns,
            },
            itemSize: 24,

            height: dimensions.height - additionalRows.length * rowHeight - 1,
            width: dimensions.widthWithScrollbar,

            children: TableRow,
          }),
        ]),

        h('div', {
          className: 'borders',
        }, columns && columns.map(col =>
          !col.borderLeft ? null : (
            h('span', {
              key: col.key,
              style: {
                position: 'absolute',
                left: col.left - 8 - headerOffsetLeft,
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
