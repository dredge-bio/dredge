import styled, { CSSObject } from 'styled-components'

export const TableWrapper = styled.div`
  position: relative;
  height: 100%;
  border: 1px solid #ccc;
  overflow-x: hidden;

  & table {
    table-layout: fixed;
    border-collapse: collapse;
    /* background-color: white; */
  }

  & * {
    font-family: SourceSansPro;
    font-size: 14px;
  }

  & th {
    text-align: left;
  }

  & .frozen-columns::-webkit-scrollbar {
    width: 0;
  }

  .transcript-row: {
    position: relative;
  }

  .transcript-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .transcript-save-marker {
    display: inline-block;
    width: calc(100% - 4px);
    text-align: center;
    line-height: 1.66em
    font-weight: bold;

    text-decoration: none;
  }

  .transcript-save-mraker:hover {
    background-color: #f0f0f0;
    border: 2px solid currentcolor;
    border-radius: 4px;
    line-height: calc(1.66em - 4px);
  }
`

export const TableHeaderWrapper = styled.div<{
  rowHeight: number;
  numRows: number;
  totalWidth: number | string;
}>`
  width: ${props => typeof props.totalWidth === 'string' ? props.totalWidth : `${props.totalWidth}px`};
  height: ${props => props.numRows * props.rowHeight}px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #666;
`

export const TableHeaderRow = styled.div<{
  rowHeight: number,
}>`
  position: relative;
  height: ${props => props.rowHeight}px;
  line-height: ${props => props.rowHeight}px;
`

export const TableBodyWrapper = styled.div<{
  rowHeight: number;
  numRows: number;
  tableWidthSet: boolean;
}>`
  width: 100%;
  height: calc(100% - ${props => props.numRows * props.rowHeight}px);
  background-color: white;
  overflow-y: ${props => props.tableWidthSet ? 'unset' : 'scroll'};
  contain: layout;

  & .transcript-row:hover {
    background-color: #e6e6e6;
  }

  /*
  & :hover {
    cursor: pointer;
  }
  */
`

export const TableHeaderCell = styled.div``

export const TableHeaderCellWrapper = styled.span<{
  left: number;
  width: number;
  borderLeft?: boolean;
  clickable?: boolean;
  css?: CSSObject;
}>`
  position: absolute;
  font-weight: bold;
  user-select: none;
  top: 0;
  bottom: 0;
  padding: 0 6px;
  left: ${props => props.left}px;
  width: ${props => props.width}px;
  ${props => props.clickable ? 'cursor: pointer;' : ''}
  ${props => props.borderLeft ? 'border-left: 1px solid #ccc;' : ''}
  ${props => props.css}
`
