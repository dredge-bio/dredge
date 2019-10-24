"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , { version } = require('../../../package.json')
    , fakeBase = 'http://example.com'
    , baseFolder = `dredge-${version}`

function formatTree(config) {
  const rootURL = new URL(config._baseURL + '/', fakeBase).href

  const tree = [
    {
      name: fakeBase,
      isDefault: true,
      children: [
        {
          name: baseFolder,
          isDefault: true,
          children: [
            {
              name: 'lib',
              isDefault: true,
              children: [
                { name: '...', isDefault: true },
              ],
            },
            {
              name: 'r-scripts',
              isDefault: true,
              children: [
                { name: '...', isDefault: true },
              ],
            },

            { name: `dredge-${version}.js`, isDefault: true },
            { name: `dredge-${version}.min.js`, isDefault: true },
            { name: 'favicon.ico', isDefault: true },
            { name: 'index.html', isDefault: true },
          ],
        },
      ],
    },
  ]

  const addEntry = (entry, help=null) => {
    const url = new URL(entry, rootURL)
        , path = [fakeBase, baseFolder, ...url.pathname.slice(1).split('/')].filter(x => x)
        , filename = path.pop()
        , file = { name: filename, help }

    let tok
      , curChildList = tree

    const sort = () => {
      curChildList.sort((a, b) => {
        if (a.children && !b.children) return -1
        if (!a.children && b.children) return 1

        if (a.name > b.name) return 1
        if (a.name < b.name) return -1

        return 0
      })
    }

    sort()

    while ( (tok = path.shift()) ) {
      let nextTree = curChildList.filter(({ name }) => name === tok)[0]

      if (!nextTree) {
        nextTree = { name: tok }
        curChildList.push(nextTree)
      }

      if (!nextTree.children) {
        nextTree.children = []
      }

      curChildList = nextTree.children
      sort()
    }

    curChildList.push(file)
  }

  // addEntry('./')
  addEntry(rootURL + '/project.json')
  addEntry(config.treatments)
  addEntry(config.abundanceMeasures)

  if (config.diagram) addEntry(config.diagram)
  if (config.grid) addEntry(config.grid)
  if (config.transcriptAliases) addEntry(config.transcriptAliases)

  const pairwiseNameOK = (
    config.pairwiseName &&
    config.pairwiseName.includes('%A') &&
    config.pairwiseName.includes('%B')
  )

  if (pairwiseNameOK) {
    addEntry(config.pairwiseName
      .replace('%A', 'T1')
      .replace('%B', 'T2'))

    addEntry(config.pairwiseName
      .replace('%A', 'T2')
      .replace('%B', 'T3'))

    addEntry(
      config.pairwiseName.slice(0, config.pairwiseName.lastIndexOf('/')) +
      '/(...rest of treatments...)')
  }

  let y = 0

  const entries = []

  function flatten(nodes, x=0) {
    nodes.forEach(node => {
      entries.push({
        x,
        y: y++,
        name: node.name,
        isFolder: !!node.children,
        isCustom: !node.isDefault,
        help: node.help,
      })

      if (node.children) {
        flatten(node.children, x + 1)
      }
    })
  }

  flatten(tree)

  return entries
}


module.exports = function ConfigTree({
  config,
}) {
  const tree = formatTree(config)

  const spacing = {
    x: 25,
    y: 20,
  }

  const lines = tree.reduce((acc, item, index) => {
    const newLines = []
        , rest = tree.slice(index + 1)

    const inFolder = R.takeWhile(
      nextItem => nextItem.x > item.x,
      rest)


    const lastInFolder = R.findLastIndex(
      nextItem => nextItem.x === item.x + 1,
      inFolder
    )

    if (lastInFolder > -1) {
      newLines.push({
        x1: item.x * spacing.x + 8,
        x2: item.x * spacing.x + 8,
        y1: (item.y) * spacing.y + 6,
        y2: (item.y + lastInFolder + 1) * spacing.y - 5,
      })
    }

    if (item.x) {
      newLines.push({
        x1: (item.x - 1) * spacing.x + 8,
        x2: item.x * spacing.x - 4,
        y1: (item.y) * spacing.y - 5,
        y2: (item.y) * spacing.y - 5,
      })
    }

    return acc.concat(newLines)
  }, [])

  return (
    h('svg', {
      height: spacing.y * (tree.length + 1),
    }, [

      h('g', {
        transform: `translate(0,${spacing.y})`,
      }, [
        h('g', tree.map(item =>
          h('g', {
            transform: `translate(${item.x * spacing.x},${item.y * spacing.y})`,
          }, [
            h('text', {
              style: {
                fontWeight: item.isCustom ? 'bold' : 'unset',
              },
            }, [
              item.isFolder ? '🗀 ' : '',
              decodeURIComponent(item.name),
            ]),
          ])
        )),

        h('g', lines.map(line =>
          h('line', Object.assign({}, line, {
            stroke: '#333',
            strokeWidth: '1px',
          }))
        )),
      ]),
    ])
  )
}
