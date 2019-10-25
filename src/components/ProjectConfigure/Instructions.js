"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Box, Heading } = require('rebass')
    , Documentation = require('./Documentation')
    , fields = require('./fields')

module.exports = class Instructions extends React.Component {
  constructor() {
    super();

    this.state = {
      highlight: null,
    }

    this.containerRef = React.createRef()
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.showHelp !== this.props.showHelp
  }

  componentDidUpdate() {
    if (this.props.showHelp) {
      const el = this.containerRef.current
        .querySelector('#field-' + this.props.showHelp)

      el.scrollIntoView()
    }
  }

  render() {
    const { showHelp } = this.props

    return (
      h('div', {
        ref: this.containerRef,
      }, [
        h(Box, Object.values(fields).map(({ name, label, required }) =>
          h(Box, {
            key: name,
            id: `field-${name}`,
            mb: 4,
          }, [
            h(Heading, {
              as: 'h2',
              p: 2,
              ml: -2,
              style: {
                transition: showHelp === name
                  ? 'background-color 0s'
                  : 'background-color .5s ease .5s',
                backgroundColor: showHelp === name
                  ? 'hsl(205,35%,75%)'
                  : 'transparent',
              },
            }, label),
            h(Documentation, { fieldName: name }),
          ])
        )),
      ])
    )
  }
}
