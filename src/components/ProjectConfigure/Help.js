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

    this.state = {
      showHelp: null,
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.showHelp !== prevProps.showHelp) {
      this.setState({
        showHelp: this.props.showHelp,
      })
    }
  }

  render() {
    const { showHelp } = this.state
        , { config } = this.props

    return (
      h(Box, {
        py: 3,
        px: 4,
        bg: '#fcfcfc',
      }, [
        h(Box, {
          style: {
            minWidth: 420,
            maxWidth: 720,
            margin: '0 auto',
            height: '100%',
          },
        }, [
            h(Heading, {
              as: 'h1',
              fontSize: 5,
              mb: 3,
            }, 'Instructions'),

            h(Documentation, { fieldName: 'instructions' }),

            h(Instructions, { showHelp }),

            h(ConfigTree, { config }),
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
