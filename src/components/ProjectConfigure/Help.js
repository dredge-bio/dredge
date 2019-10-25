"use strict";

const h = require('react-hyperscript')
    , React = require('react')
    , { Flex, Box } = require('rebass')
    , styled = require('styled-components').default
    , ConfigTree = require('./ConfigTree')
    , Documentation = require('./Documentation')

const Tab = styled(Box)`
flex: 1;
text-decoration: none;

color: black;
background-color: #fff;

text-align: center;

&:hover {
  background-color: #f0f0f0;
}

border: 1px solid #999;
padding: 1rem;
border-radius: 6px 6px 0 0;

&:not(:last-of-type) {
  margin-right: -1px;
}
`


module.exports = class HelpPage extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedTab: 'instructions',
    }
  }

  render() {
    const { selectedTab } = this.state

    return (
      h(Box, {
        px: 4,
      }, [
        h(Box, {
          style: {
            maxWidth: 800,
            margin: '0 auto',
            height: '100%',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
          }
        }, [
          h(Flex, [
            h(Tab, {
              as: 'a',
              href: '#',
              onClick: () => this.setState({ selectedTab: 'instructions' }),
              style: selectedTab !== 'instructions' ? null : {
                borderBottom: '1px solid white',
              },
            }, [
              h('h2', 'Instructions'),
            ]),

            h(Tab, {
              as: 'a',
              href: '#',
              onClick: () => this.setState({ selectedTab: 'layout' }),
              style: selectedTab !== 'layout' ? null : {
                borderBottom: '1px solid white',
              },
            }, [
              h('h2', 'Expected file layout'),
            ]),
          ]),

          h(Box, {
            bg: 'green',
            style: {
              position: 'relative',
              height: '100%',
              overflowY: 'hidden',
            },
          }, [
            h(Box, {
              p: 2,
              px: 5,
              bg: 'white',
              mt: '-1px',
              style: {
                border: '1px solid #999',
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                overflowY: 'scroll',
              },
            }, [
              selectedTab !== 'instructions' ? null : (
                h(Documentation, { fieldName: 'instructions' })
              ),

              selectedTab !== 'layout' ? null : (
                h('div', {
                  style: {
                    textAlign: 'center',
                  },
                }, [
                  h(ConfigTree, { config }),
                ])
              ),
            ]),

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
          ])
        ]),
      ])
    )
  }
}
