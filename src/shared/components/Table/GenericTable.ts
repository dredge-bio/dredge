import { createElement as h } from 'react'
import * as R from 'ramda'
import * as React from 'react'
import {
  VariableSizeGrid,
  VariableSizeGridProps,
  GridChildComponentProps
} from 'react-window'

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

const { useRef, useState, useEffect } = React

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
  onRowLeave?: () => void;

  rowHeight?: number;
  renderHeaderRows?: (
    columns: (TableColumn<Context, ItemData, SortPath> & { left: number })[],
    context: Context
  ) => React.ReactNode[];

}

type CellProps<Context, ItemData, SortPath> = {
  data: ItemData;
  columns: (TableColumn<Context, ItemData, SortPath> & { left: number })[];
  inRow: number | null,
  inColumn: number | null,
  rowClassName?: string | ((data: ItemData, index: number) => string);
  onCellEnter: (rowIndex: number, columnIndex: number) => void;
  onRowClick?: (data: ItemData, index: number, event: MouseEvent) => void;
  onRowEnter?: (data: ItemData, index: number, event: MouseEvent) => void;
  onRowLeave?: (data: ItemData, index: number, event: MouseEvent) => void;
}

function TableCell<Context, ItemData, SortPath>(
  props: GridChildComponentProps<CellProps<Context, ItemData, SortPath>>
) {
  const {
    style,
    data: {
      data,
      columns,
      onCellEnter,
      inRow,
      inColumn,
      rowClassName,
      onRowClick,
      onRowEnter,
      onRowLeave,
    },
    rowIndex,
    columnIndex,
  } = props

  /*
  let className: undefined | string

  if (typeof rowClassName === 'string') {
    className = rowClassName
  } else if (rowClassName) {
    className = rowClassName(data, rowIndex)
  }
  */

  const column = columns[columnIndex]!
      , cell = column.renderRow(data, rowIndex)

  const extraStyle: React.CSSProperties = {
    padding: '0 6px',
    cursor: 'pointer',
    lineHeight: style.height + 'px',
  }

  if (column.borderLeft) {
    extraStyle.borderLeft = '1px solid #ccc';
  }

  if (columnIndex === inColumn) {
    extraStyle.backgroundColor = '#f0f0f0';
  }

  if (rowIndex === inRow) {
    extraStyle.backgroundColor = '#f0f0f0';
  }

  return (
    h('span', {
      style: {
        ...style,
        ...extraStyle,
      },
      onMouseEnter(e: MouseEvent) {
        if (onRowEnter) {
          onRowEnter(data, rowIndex, e)
        }
        onCellEnter(rowIndex, columnIndex)
      },
    }, cell)
  )
}

/*
const MemoizedTableRow = memo(TableRow, (prevProps, nextProps) => {
  let oldClassName: string = ''
    , newClassName: string = ''

  if (typeof prevProps.data.rowClassName === 'string') {
    oldClassName = prevProps.data.rowClassName
  } else if (typeof prevProps.data.rowClassName === 'function') {
    oldClassName = prevProps.data.rowClassName(prevProps.data.data, prevProps.rowIndex)
  }

  if (typeof nextProps.data.rowClassName === 'string') {
    newClassName = nextProps.data.rowClassName
  } else if (typeof nextProps.data.rowClassName === 'function') {
    newClassName = nextProps.data.rowClassName(nextProps.data.data, nextProps.rowIndex)
  }

  return (
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.columnIndex === nextProps.columnIndex &&
    R.equals(prevProps.data.columns.map(x => x.key), nextProps.data.columns.map(x => x.key)) &&
    shallowEquals(prevProps.data.data, nextProps.data.data) &&
    oldClassName === newClassName
  )
}) as typeof TableRow
*/

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

    const headerWrapperRef = useRef<HTMLDivElement | null>(null)


    const [ dimensions, setDimensions ] = useState<DimensionState>(null)
        , [ columns, setColumns ] = useState<(TableColumn<Context, ItemData, SortPath> & { left: number })[] | null>(null)
        , [ headerWidth, setHeaderWidth ] = useState<string | number>('100%')
        , [ inRow, setInRow ] = useState<number | null>(null)
        , [ inColumn, setInColumn ] = useState<number | null>(null)

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

    type ListData = CellProps<Context, ItemData, SortPath>
    type ListComponent = VariableSizeGrid<ListData>
    type ListProps = VariableSizeGridProps<ListData>

    const TranscriptList = VariableSizeGrid as React.ClassType<
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
                width: col.width,
                borderLeft: col.borderLeft,
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
          onMouseLeave() {
            if (onRowLeave) {
              onRowLeave()
            }
            setInRow(null)
            setInColumn(null)
          },
        }, ...[
          dimensions && columns && h(TranscriptList, {
            ref: windowListRef,
            innerRef: listRef,
            // overscanCount: 50,

            rowCount: itemCount,
            rowHeight: () => rowHeight,
            columnCount: columns.length,
            columnWidth: (index: number) => columns[index]!.width,
            onScroll(e) {
              headerWrapperRef.current!.style.transform = `translateX(-${e.scrollLeft}px)`
            },

            height: dimensions.height - additionalRows.length * rowHeight - 1,
            width: dimensions.widthWithScrollbar,


            itemData: {
              inRow,
              inColumn,
              onCellEnter(rowIndex, columnIndex) {
                setInRow(rowIndex)
                setInColumn(columnIndex)
              },
              onRowClick,
              onRowEnter,
              onRowLeave,
              rowClassName,
              data: itemData,
              columns,
            },

            children: TableCell,
          }),
        ]),

      ])
    )
  }
}
