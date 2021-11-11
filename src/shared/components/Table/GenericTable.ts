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
  TableHeaderCellWrapper,
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
  freezeColumns?: number,
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

type MouseCellPosition = {
  type: 'scroll' | 'frozen';
  rowIndex: number;
  columnIndex: number;
}

type CellProps<Context, ItemData, SortPath> = {
  data: ItemData;
  columns: (TableColumn<Context, ItemData, SortPath> & { left: number })[];
  columnType: 'scroll' | 'frozen';
  mousePosition: MouseCellPosition | null;
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
      mousePosition,
      columnType,
      onRowClick,
      onRowEnter,
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

  if (mousePosition) {
    const shade = (
      mousePosition.rowIndex === rowIndex || (
        mousePosition.type === columnType &&
        columnType === 'scroll' &&
        mousePosition.columnIndex === columnIndex
      )
    )

    if (shade) {
      extraStyle.backgroundColor = '#f0f0f0';
    }
  }

  return (
    h('span', {
      style: {
        ...style,
        ...extraStyle,
      },
      onClick(e: MouseEvent) {
        if (onRowClick) {
          onRowClick(data, rowIndex, e)
        }
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

type TableHeaderCellProps<Context, ItemData, SortPath> = {
  column: TableColumn<Context, ItemData, SortPath> & { left: number };
  context: Context;
  updateSort: (sortPath: SortPath, order: TableSortOrder) => void;
  sortOrder: TableSortOrder;
}

function TableHeaderCell<Context, ItemData, SortPath>(
  props: TableHeaderCellProps<Context, ItemData, SortPath>
) {
  const { column, context, updateSort, sortOrder } = props

  return (
    h(TableHeaderCellWrapper, {
      left: column.left,
      clickable: column.sort !== null,
      width: column.width,
      borderLeft: column.borderLeft,
      onClick: () => {
        if (!column.sort) return

        const active = column.sort.active(context)
            , nextOrder = (active && sortOrder === 'asc') ? 'desc' : 'asc'

        updateSort(column.sort.key, nextOrder)

      },
    }, ...[

      typeof column.label === 'string'
        ? column.label
        : column.label(context),

      column.sort === null ? null : (() => {
        const active = column.sort.active(context)

        if (!active) return null

        return (
          h('span', {
            style: {
              position: 'relative',
              fontSize: 10,
              top: -1,
              left: 1,
            },
          }, sortOrder === 'asc' ? ' ▾' : ' ▴')
        )
      })(),
    ])
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
      freezeColumns,
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
        , [ mousePosition, setMousePosition ] = useState<MouseCellPosition | null>(null)

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

    const scrollGridRef = useRef<ListComponent>(null)
        , frozenGridRef = useRef<ListComponent>(null)

    const frozenColumns = (columns || []).slice(0, freezeColumns)
        , scrollColumns = (columns || []).slice(freezeColumns)
        , frozenWidth = R.sum(frozenColumns.map(x => x.width))

    const HeaderCell = TableHeaderCell as React.FunctionComponent<
      TableHeaderCellProps<Context, ItemData, SortPath>
    >

    return (
      h(TableWrapper, {
        className,
        ref,
      }, ...[
        h(TableHeaderWrapper, {
          ref: headerWrapperRef,
          style: {
            contain: 'layout',
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
          }, columns && scrollColumns.map(column =>
              h(HeaderCell, {
                key: `scroll-${column.key}`,
                column,
                context,
                sortOrder: props.sortOrder,
                updateSort: props.updateSort,
              })
           )),
        ]),

        h(TableHeaderWrapper, {
          rowHeight,
          numRows: additionalRows.length + 1,
          totalWidth: frozenWidth + 1,
          style: {
            position: 'absolute',
            left: 0,
            top: 0,
            borderRight: '1px solid #666',
          },
        }, [
          ...additionalRows.map((node, i) =>
            h(TableHeaderRow, {
              rowHeight,
              key: `table-row-${i}`,
            })
          ),

          h(TableHeaderRow, {
            rowHeight,
            key: 'column-headers',
          }, columns && frozenColumns.map(column =>
              h(HeaderCell, {
                key: `frozen-${column.key}`,
                column,
                context,
                sortOrder: props.sortOrder,
                updateSort: props.updateSort,
              })
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
            setMousePosition(null)
          },
        }, ...[
          !freezeColumns ? null : (dimensions && columns && h(TranscriptList, {
            ref: frozenGridRef,
            className: 'frozen-columns',
            style: {
              position: 'absolute',
              borderRight: '1px solid #333',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              zIndex: 1,
            },
            rowCount: itemCount,
            rowHeight: () => rowHeight,
            columnCount: frozenColumns.length,
            columnWidth: (index: number) => frozenColumns[index]!.width,
            overscanColumnCount: 20,
            onScroll(e) {
              if (scrollGridRef.current) {
                scrollGridRef.current.scrollTo({ scrollTop: e.scrollTop })
              }
            },

            height: dimensions.height - additionalRows.length * rowHeight - 1,
            width: frozenWidth + 1,

            itemData: {
              columnType: 'frozen',
              mousePosition,
              onCellEnter(rowIndex, columnIndex) {
                setMousePosition({
                  type: 'frozen',
                  rowIndex,
                  columnIndex,
                })
              },
              onRowClick,
              onRowEnter,
              onRowLeave,
              rowClassName,
              data: itemData,
              columns: frozenColumns,
            },

            children: TableCell,
          })),

          dimensions && columns && h(TranscriptList, {
            ref: scrollGridRef,
            // overscanCount: 50,
            style: {
              position: 'absolute',
              left: frozenWidth,
            },

            rowCount: itemCount,
            rowHeight: () => rowHeight,
            columnCount: scrollColumns.length,
            columnWidth: (index: number) => scrollColumns[index]!.width,
            onScroll(e) {
              if (!e.scrollUpdateWasRequested) {
                headerWrapperRef.current!.style.transform = `translateX(-${e.scrollLeft}px)`
              }
              if (frozenGridRef.current) {
                frozenGridRef.current.scrollTo({ scrollTop: e.scrollTop })
              }
            },

            height: dimensions.height - additionalRows.length * rowHeight - 1,
            width: dimensions.widthWithScrollbar - frozenWidth,


            itemData: {
              columnType: 'scroll',
              mousePosition,
              onCellEnter(rowIndex, columnIndex) {
                setMousePosition({
                  type: 'scroll',
                  rowIndex,
                  columnIndex,
                })
              },
              onRowClick,
              onRowEnter,
              onRowLeave,
              rowClassName,
              data: itemData,
              columns: scrollColumns,
            },

            children: TableCell,
          }),
        ]),

      ])
    )
  }
}
