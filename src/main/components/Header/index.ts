import { createElement as h, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Route, useNavigation } from 'org-shell'
import { Flex, Box, Button } from 'rebass'
import * as AriaMenuButton from 'react-aria-menubutton'
import Clipboard from 'clipboard'

import { version } from '../../../../package.json'
import { useAppSelector } from '../../hooks'
import { Permalink } from '@dredge/main'

interface HeaderProps {
  height: number;
  onRequestResize: () => void;
  isLocalFile: boolean;
}

// Adapted from https://www.heropatterns.com/
const svg = `
<svg
  width="42"
  height="24"
  viewBox="0 0 84 48" xmlns="http://www.w3.org/2000/svg">

  <path
    fill="white"
    fill-opacity=".05"
    fill-rule="evenodd"
    d="
      M0
      0h12v6H0V0zm28
      8h12v6H28V8zm14-8h12v6H42V0zm14
      0h12v6H56V0zm0
      8h12v6H56V8zM42
      8h12v6H42V8zm0
      16h12v6H42v-6zm14-8h12v6H56v-6zm14
      0h12v6H70v-6zm0-16h12v6H70V0zM28
      32h12v6H28v-6zM14
      16h12v6H14v-6zM0
      24h12v6H0v-6zm0
      8h12v6H0v-6zm14
      0h12v6H14v-6zm14
      8h12v6H28v-6zm-14
      0h12v6H14v-6zm28
      0h12v6H42v-6zm14-8h12v6H56v-6zm0-8h12v6H56v-6zm14
      8h12v6H70v-6zm0
      8h12v6H70v-6zM14
      24h12v6H14v-6zm14-8h12v6H28v-6zM14
      8h12v6H14V8zM0
      8h12v6H0V8z
    "
  />
</svg>
`

const HeaderContainer = styled(Box)`
  /* Take the header out of the grid, and fix it across the top of the viewport */
  position: fixed;
  left: 0;
  right: 0;

  background-color: hsl(205, 35%, 25%);
  background-image: url("data:image/svg+xml,${encodeURIComponent(svg.trim())}");
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  & h1 {
    color: white;
    font-size: 28px;
    letter-spacing: .6px;
  }

  & select, & label {
    display: inline-block;
    height: 36px;
    border: 0;
    font-size: 16px;
    padding: 6px 1em;
  }

  & label {
    line-height: 24px;
    background-color: #ddd;
    font-weight: bold;
    border-radius: 3px 0 0 3px;
  }

  & select {
    padding-right: 2em;
    appearance: none;
    background-color: #fafafa;
    font-family: SourceSansPro;
    border-radius: 0 3px 3px 0;
  }

  & label::after {
    position: absolute;
    right: 8px;
    content: "▼";
    font-size: 12px;
  }
`

const Menu = styled(AriaMenuButton.Menu)`
  position: absolute;
  top: 42px;
  right: 0;
  z-index: 1;

  width: ${props => props.width || '240px'};
  box-shadow: -1px 1px 8px #888;

  border: 1px solid #ccc;
  background-color: white;

  ul {
    padding: 0;
    list-style-type: none;
  }

  [role="menuitem"] {
    cursor: pointer;
    padding: .5em 1em;
  }

  [role="menuitem"]:hover,
  [role="menuitem"]:focus {
    background-color: #ccc;
  }
`

function useActiveProject() {
  const { project, source } = useAppSelector(state => {
    const source = state.projects.active
        , project = state.projects.directory[source]

    return { project, source }
  })

  return { project, source }
}

function PermalinkButton() {
  const { project } = useActiveProject()
      , permalinkPrefixRef = useRef('')
      , [ showCopyMessage, setShowCopyMessage ] = useState(false)

  const notLoaded = (
    ('loaded' in project) ||
    ('failed' in project)
  )

  useEffect(() => {
    const clipboard = new Clipboard('#permalink-copy', {
      text: () => {
        return permalinkPrefixRef.current + window.location.search + window.location.hash
      },
    })

    clipboard.on('success', () => {
      setShowCopyMessage(true)
      setTimeout(() => {
        setShowCopyMessage(false)
      }, 1000)
    })

    return () => {
      clipboard.destroy()
    }
  }, [])

  if (notLoaded) return null

  const { config: { permalinkPrefix } } = project

  if (!permalinkPrefix) return null

  permalinkPrefixRef.current = permalinkPrefix

  return (
    h('div', {
      style: {
        position: 'relative',
      },
    }, ...[
      h(Button, {
        id: 'permalink-copy',
        ml: 2,
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
        },
      }, ...[
        h('span', {
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'inline-block',
            padding: '9px 0',
            marginRight: '7px',
          },
        }, 'Permalink'),

        h(Permalink, {
          height: 20,
          width: 20,
          strokeWidth: 2,
        }),
      ]),

      !showCopyMessage ? null : (
        h(Box, {
          bg: 'lightgreen',
          p: 3,
          style: {
            whiteSpace: 'nowrap',
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
          },
        }, ...[
          'Permalink copied to clipboard',
        ])
      ),
    ])
  )
}

export default function Header(props: HeaderProps) {
  const { onRequestResize, isLocalFile, height } = props
      , navigateTo = useNavigation()

  const { project } = useActiveProject()

  let projectLabel = ''
    , hasReadme = false
    , headerText = ''

  if (
    project &&
    !('loaded' in project) &&
    !('failed' in project)
  ) {
    projectLabel = project.config.label
    headerText = projectLabel
    hasReadme = !!project.config.readme
  }

  if (!headerText) {
    headerText = 'DrEdGE: Differential Expression Gene Explorer'
  }

  return (
    h(HeaderContainer, {
      as: 'header',
      px: 4,
      style: {
        height,
      },
    }, ...[
      h('div', { style: { display: 'flex' }}, ...[
        h('h1', {
          style: {
            display: 'flex',
            fontFamily: 'SourceSansPro',
          },
        }, ...[
          headerText,
          /*
          (!view || view.project.source !== 'local') ? null : (
            h(Button, {
              ml: 2,
              onClick() {
                navigateTo(new Route('configure'))
              },
            }, '‹ Return to editing')
          ),
          */
        ]),
      ]),

      isLocalFile ? null : h(Flex, { alignItems: 'center' }, ...[
        h(PermalinkButton),

        h(AriaMenuButton.Wrapper, {
          style: {
            position: 'relative',
          },
          onSelection: val => {
            if (val === 'home') {
              navigateTo(new Route('home'))
            } else if (val === 'help') {
              navigateTo(new Route('help'))
            } else if (val === 'resize') {
              onRequestResize()
            } else if (val === 'about') {
              navigateTo(new Route('about'))
            } else if (val === 'dredge-home') {
              window.location.href = 'http://dredge.bio.unc.edu'
            }
          },
        }, ...[
          h(Button, {
            ml: 2,
            style: {
              padding: 0,
            },
          }, ...[
            h(AriaMenuButton.Button, {
              style: {
                fontSize: '16px',
                padding: '9px 14px',
                display: 'inline-block',
              },
            }, 'Menu'),
          ]),

          h(Menu, null, ...[
            h('ul', null, ...[
              !projectLabel ? null : h(Box, {
                is: 'li',
                style: {
                  color: '#666',
                  padding: '.5rem 1rem .5rem 1rem',
                  fontSize: '14px',
                },
              }, projectLabel),

              h('li', null, h(AriaMenuButton.MenuItem, {
                value: 'home',
              }, projectLabel ? 'View' : 'Home')),

              !hasReadme ? null : h('li', null, h(AriaMenuButton.MenuItem, {
                value: 'about',
              }, 'About dataset')),

              !projectLabel ? null : h(Box, {
                is: 'li',
                style: {
                  color: '#666',
                  borderBottom: '1px solid #ccc',
                  fontSize: '14px',
                },
              }),

              h('li', null, h(AriaMenuButton.MenuItem, {
                value: 'resize',
              }, 'Resize application to window')),

              h('li', null, h(AriaMenuButton.MenuItem, {
                value: 'help',
              }, 'About DrEdGE')),

              h('li', null, h(AriaMenuButton.MenuItem, {
                value: 'dredge-home',
              }, 'DrEdGE project homepage')),

              h(Box, {
                is: 'li',
                style: {
                  color: '#666',
                  padding: '1em',
                  borderTop: '1px solid #ccc',
                  fontSize: '12px',
                  textAlign: 'center',
                },
              }, `DrEdGE v${version}`),
            ]),
          ]),
        ]),
      ]),

    ])
  )
}
