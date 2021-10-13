import { createElement as h } from 'react'
import { Box, Heading } from 'rebass'
import styled from 'styled-components'

const LocalFileContainer = styled(Box)`
p, ul {
  margin-bottom: 1.3rem;
}

h1, li {
  margin-bottom: 1rem;
}

code {
  font-family: monospace;
  font-size: 16px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 4px;
}
`

export default function LocalFileMessage() {
  return (
    h(LocalFileContainer, {
      p: 4,
      style: {
        maxWidth: 720,
      },
    }, [
      h(Heading, { as: 'h1' }, 'Setup'),

      h('p', null, `
        You have loaded DrEdGE without using a Web server. While DrEdGE is designed to work
        with all local files, it must be served from a Web server to function.
        To run one on your local machine using Python, run one of the following commands
        in the directory where you extracted DrEdGE:
      `),

      h('ul', null, ...[
        h('li', null, ...[
          h('b', null, 'Python 3: '),
          h('code', null, 'python3 -m http.server 8006'),
        ]),

        h('li', null, ...[
          h('b', null, 'Python 2: '),
          h('code', null, 'python -m SimpleHTTPServer 8006'),
        ]),
      ]),

      h('p', null, ...[
        'Then open the page ',
        h('a', { href: 'http://127.0.0.1:8006' }, 'http://127.0.0.1:8006'),
        '.',
      ]),
    ])
  )
}
