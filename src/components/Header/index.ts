import h from 'react-hyperscript'
import styled from 'styled-components'
import { Route, useNavigation } from 'org-shell'
import { Flex, Box, Button } from 'rebass'
import * as AriaMenuButton from 'react-aria-menubutton'

import { version } from '../../../package.json'
import { useAppSelector } from '../../hooks'

interface HeaderProps {
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

export default function Header(props: HeaderProps) {
  const { onRequestResize, isLocalFile } = props
      , navigateTo = useNavigation()

  const { view, projects } = useAppSelector(state => ({
    view: state.view?.default,
    projects: state.projects,
  }))

  let projectLabel = ''
    , hasReadme = false
    , headerText = ''

  if (view) {
    const project = projects[view.source.key]

    if (project && project.loaded && !project.failed) {
      projectLabel = project.config.label
      headerText = projectLabel
      hasReadme = !!project.config.readme
    }
  }

  if (!headerText) {
    headerText = 'DrEdGE: Differential Expression Gene Explorer'
  }

  // FIXME: is this a typo?
  const hasProjectReadme = view && view.source && projects

  return (
    h(HeaderContainer, {
      as: 'header',
      px: 4,
    }, [
      h('div', { style: { display: 'flex' }}, [
        h('h1', {
          style: {
            display: 'flex',
            fontFamily: 'SourceSansPro',
          },
        }, [
          headerText,
          (!view || view.source.key !== 'local') ? null : (
            h(Button, {
              ml: 2,
              onClick() {
                navigateTo(new Route('configure'))
              },
            }, '‹ Return to editing')
          ),
        ]),
      ]),

      isLocalFile ? null : h(Flex, { alignItems: 'center' }, [
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
        }, [
          h(Button, {
            ml: 2,
            style: {
              padding: 0,
            },
          }, [
            h(AriaMenuButton.Button, {
              style: {
                fontSize: '16px',
                padding: '9px 14px',
                display: 'inline-block',
              },
            }, 'Menu'),
          ]),

          h(Menu, [
            h('ul', [
              !projectLabel ? null : h(Box, {
                is: 'li',
                style: {
                  color: '#666',
                  padding: '.5rem 1rem .5rem 1rem',
                  fontSize: '14px',
                },
              }, projectLabel),

              h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'home',
              }, projectLabel ? 'View' : 'Home')),

              !hasReadme ? null : h('li', {}, h(AriaMenuButton.MenuItem, {
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

              h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'resize',
              }, 'Resize application to window')),

              h('li', {}, h(AriaMenuButton.MenuItem, {
                value: 'help',
              }, 'About DrEdGE')),

              h('li', {}, h(AriaMenuButton.MenuItem, {
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
