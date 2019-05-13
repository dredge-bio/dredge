"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Button } = require('rebass')


module.exports = class FileInput extends React.Component {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick() {
    const { onChange } = this.props
        , inputEl = document.createElement('input')

    inputEl.type = 'file'
    inputEl.onchange = onChange
    inputEl.click()
  }

  render() {
    const childProps = Object.assign({}, this.props, {
      onClick: this.handleClick,
    })

    return (
      h(Button, childProps)
    )
  }
}
