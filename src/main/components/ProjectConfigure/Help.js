"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Flex, Box, Heading } = require('rebass')
    , styled = require('styled-components').default
    , ConfigTree = require('./ConfigTree')
    , Instructions = require('./Instructions')
    , Documentation = require('./Documentation')

module.exports = class HelpPage extends React.Component {
  constructor() {
    super();

    this.containerRef = React.createRef()
  }

  componentDidUpdate(prevProps) {
    if (this.props.showHelp && (this.props.showHelp !== prevProps.showHelp)) {
      const { showHelp } = this.props

      const el = this.containerRef.current
        .querySelector(`[data-field*="${showHelp}"]`)

      if (!el) return

      el.scrollIntoView()

      el.style.transition = 'background-color 0s'
      el.style.backgroundColor = 'hsl(205,35%,75%)'

      setTimeout(() => {
        el.style.transition = 'background-color .5s ease .5s'
        el.style.backgroundColor = 'transparent'
      }, 0)
    }
  }

  render() {
    return (
      h('div', {
        ref: this.containerRef,
      }, [
        h(Box, {
          py: 3,
          px: 4,
        }, [
          h(Box, {
            style: {
              minWidth: 420,
              maxWidth: 720,
              margin: '0 auto',
              height: '100%',
            },
          }, [
              h(Documentation, { fieldName: 'instructions' }),

              // h(Instructions, { showHelp }),

              // h(ConfigTree, { config }),
          ]),
        ]),
      ])
    )
  }
}

            /*

            h(Box, { as: 'h3', mt: 3, mb: 2 }, 'Video tutorial'),

            h('iframe', {
              src: 'https://player.vimeo.com/video/336692169',
              frameBorder: "0",
              width: '100%',
              height: '400',
              allow: 'fullscreen',
              allowFullScreen: true,
              style: {
                border: '2px solid #333',
              },
            }),
            */
