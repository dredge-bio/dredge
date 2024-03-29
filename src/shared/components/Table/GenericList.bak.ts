import { createElement as h } from 'react'
import * as R from 'ramda'
import * as React from 'react'
import { FixedSizeList, FixedSizeListProps, ListChildComponentProps } from 'react-window'

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
  data: ItemData;
  columns: (TableColumn<Context, ItemData, SortPath> & { left: number })[];
  rowClassName?: string | ((data: ItemData, index: number) => string);
  onRowClick?: (data: ItemData, index: number, event: MouseEvent) => void;
  onRowEnter?: (data: ItemData, index: number, event: MouseEvent) => void;
  onRowLeave?: (data: ItemData, index: number, event: MouseEvent) => void;
}

type CellProps = React.PropsWithChildren<{
  left: number;
  width: number;
}>

function TableCell(props: CellProps) {
  const { children, left, width } = props

  return (
    h('div', {
      style: {
        position: 'absolute',
        left,
        width,
      },
    }, children)
  )
}

function TableRow<Context, ItemData, SortPath>(
  props: ListChildComponentProps<RowProps<Context, ItemData, SortPath>>
) {
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
    h('div', {
      className,
      onClick: onRowClick && ((e: MouseEvent) => onRowClick(data, index, e)),
      onMouseEnter: onRowEnter && ((e: MouseEvent) => onRowEnter(data, index, e)),
      onMouseLeave: onRowLeave && ((e: MouseEvent) => onRowLeave(data, index, e)),
      style,
    }, (columns || []).map(column => (
      h(TableCell, {
        key: column.key,
        left: column.left,
        width: column.width,
      }, column.renderRow(data, index))
    )))
  )
}

const MemoizedTableRow = memo(TableRow, (prevProps, nextProps) => {
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
}) as typeof TableRow

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

    const borderElRef = useRef<HTMLDivElement>()
        , headerWrapperRef = useRef<HTMLDivElement | null>(null)


    const [ dimensions, setDimensions ] = useState<DimensionState>(null)
        , [ columns, setColumns ] = useState<(TableColumn<Context, ItemData, SortPath> & { left: number })[] | null>(null)
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
        requestAnimationFrame(() => {
          headerWrapperRef.current!.style.transform = `translateX(-${scrollEl.scrollLeft}px)`
          borderElRef.current!.style.transform = `translateX(-${scrollEl.scrollLeft}px)`
        })

        // setHeaderOffsetLeft(scrollEl.scrollLeft)
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

    type ListData = RowProps<Context, ItemData, SortPath>
    type ListComponent = FixedSizeList<ListData>
    type ListProps = FixedSizeListProps<ListData>

    const TranscriptList = FixedSizeList as React.ClassType<
      ListProps,
      ListComponent,
      new () => ListComponent
    >

    const windowListRef = useRef<ListComponent>(null)

    return (
      h(TableWrapper, {
        className,
        ref,
      }, ...[
        h(TableHeaderWrapper, {
          ref: headerWrapperRef,
          style: {
            willChange: 'transform',
          },
          rowHeight,
          numRows: additionalRows.length + 1,
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

        h('div', {
          className: 'borders',
          ref: borderElRef,
          style: {
            willChange: 'transform',
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        }, columns && columns.map(col =>
          !col.borderLeft ? null : (
            h('span', {
              key: col.key,
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

        h(TableBodyWrapper, {
          rowHeight,
          numRows: additionalRows.length + 1,
          className: 'table-scroll',
          tableWidthSet: dimensions !== null,
        }, ...[
          dimensions && columns && h(TranscriptList, {
            ref: windowListRef,
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

            children: MemoizedTableRow,
          }),
        ]),

      ])
    )
  }
}
