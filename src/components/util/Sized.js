"use strict";

const h = require('react-hyperscript')
    , React = require('react')

module.exports = function makeSized(onResize) {
  return Component => {
    class Sized extends React.Component {
      constructor() {
        super();

        this.state = {}
        this.refreshSize = this.refreshSize.bind(this)
      }

      componentDidMount() {
        this.refreshSize()
        window.addEventListener('application-resize', this.refreshSize)
      }

      componentWillUnmount() {
        window.removeEventListener('application-resize', this.refreshSize)
      }

      refreshSize() {
        this.setState({}, () => this.setState(onResize(this.el)))
      }

      render() {
        return h('div', {
          ref: el => this.el = el,
          style: {
            height: '100%',
            width: '100%',
          },
        }, h(Component, Object.assign({}, this.props, this.state)))
      }
    }

    return Sized
  }
}
