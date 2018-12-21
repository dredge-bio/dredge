"use strict";

const R = require('ramda')
    , d3 = require('d3')
    , path = require('path')
    , { makeTypedAction } = require('org-async-actions')
    , TrieSearch = require('trie-search')
    , saveAs = require('file-saver')

function isIterable(obj) {
  return Symbol.iterator in obj
}

const Action = module.exports = makeTypedAction({
  Initialize: {
    exec: initialize,
    request: {},
    response: {},
  },

  Log: {
    exec: R.always({}),
    request: {
      message: val => [].concat(val).every(val => typeof val === 'string'),
    },
    response: {},
  },

  CheckCompatibility: {
    exec: checkCompatibility,
    request: {},
    response: {},
  },

  LoadAvailableProjects: {
    exec: loadAvailableProjects,
    request: {},
    response: {
      // projects: Type.ListOf(Object),
      projects: Object,
    },
  },

  ViewProject: {
    exec: R.always({}),
    request: {
      projectBaseURL: String,
    },
    response: {},
  },

  ChangeProject: {
    exec: changeProject,
    request: {
      projectBaseURL: String,
    },
    response: {},
  },

  SetPairwiseComparison: {
    exec: setPairwiseComparison,
    request: {
      TreatmentA: String,
      TreatmentB: String,
    },
    response: {
      pairwiseData: d => d.constructor === Map,
      resort: Boolean,
    },
  },

  UpdateDisplayedGenes: {
    exec: updateDisplayedGenes,
    request: {
      sortPath: d => d == null || Array.isArray(d),
      order: d => d == null || d === 'asc' || d === 'desc',
    },
    response: {
      displayedGenes: Object,
    },
  },

  SetSavedGenes: {
    exec: setSavedGenes,
    request: {
      geneNames: isIterable,
    },
    response: {
      resort: Boolean,
    },
  },

  SetBrushedGenes: {
    exec: R.always({ resort: true }),
    request: {
      geneNames: isIterable,
    },
    response: {
      resort: Boolean,
    },
  },

  SetHoveredGene: {
    exec: R.always({}),
    request: {
      geneName: d => typeof d === 'string' || d === null,
    },
    response: {
    },
  },

  SetHoveredTreatment: {
    exec: R.always({}),
    request: {
      treatmentName: d => typeof d === 'string' || d === null,
    },
    response: {
    },
  },

  SetFocusedGene: {
    exec: R.always({}),
    request: {
      geneName: String,
    },
    response: {
    },
  },

  SetPValueThreshold: {
    exec: R.always({}),
    request: {
      threshold: Number,
    },
    response: {
    },
  },

  ImportSavedGenes: {
    exec: importSavedGenes,
    request: {
      file: Object,
    },
    response: {},
  },

  ExportSavedGenes: {
    exec: exportSavedGenes,
    request: {},
    response: {},
  },
})

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

function fetchWithoutCache(url) {
  return fetch(url, {
    headers: new Headers({
      'Cache-Control': 'no-cache',
    }),
  })
}

function fetchProjectResource(baseURL, log) {
  return async (url, opts={}) => {
    const fetchFn = opts.cache === false
      ? fetchWithoutCache
      : fetch

    const fetchURL = path.join(baseURL, url)

    const resp = await fetchFn(fetchURL)

    if (!resp.ok) {
      await (opts.onRespNotOK || (() => {
        log(`No file found at ${fetchURL}`)
      }))()

      return false
    }

    try {
      await opts.onRespOK(resp)
      return true
    } catch (err) {
      await (opts.onError || (() => {
        log(`Error processing file at ${fetchURL}`)
      }))()
      return false
    }
  }
}

async function parseRPKMFile(resp, treatments) {
  let rpkms = (await resp.text()).split('\n')

  const replicates = rpkms.shift().split('\t').slice(1)
      , genes = []

  rpkms = rpkms.map(row => {
    row = row.split('\t')
    genes.push(row.shift())
    return row.map(parseFloat)
  })

  const geneIndices = R.invertObj(genes)
      , replicateIndices = R.invertObj(replicates)

  function rpkmsForTreatmentGene(treatmentID, geneName) {
    const treatment = treatments[treatmentID]
        , geneIdx = geneIndices[geneName]

    return treatment.replicates.map(replicateID => {
      const replicateIdx = replicateIndices[replicateID]
      return rpkms[geneIdx][replicateIdx]
    })
  }

  return {
    genes,
    rpkmsForTreatmentGene,
  }
}

function cleanSVGString(svgString, treatments) {
  const parser = new DOMParser()
      , svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
      , iterator = svgDoc.createNodeIterator(svgDoc, NodeFilter.SHOW_ELEMENT)
      , treatmentNames = new Set(Object.keys(treatments))

  let curNode

  ;[...svgDoc.querySelectorAll('title')].forEach(el => {
    el.parentNode.removeChild(el)
  })

  const anchorsToRemove = []

  while ( (curNode = iterator.nextNode()) ) {
    switch (curNode.nodeName.toLowerCase()) {
      case 'path':
      case 'rect':
      case 'circle':
      case 'elipse':
      case 'polyline':
      case 'polygon': {
        let treatment = null

        const popTreatmentFromAttr = attr => {
          treatment = curNode.getAttribute(attr)
          if (treatmentNames.has(treatment)) {
            curNode.removeAttribute(attr)
            return true
          }
          return false
        }

        popTreatmentFromAttr('id') || popTreatmentFromAttr('name')

        if (treatment) {
          const { label } = treatments[treatment]

          curNode.setAttribute('data-treatment', treatment)

          const titleEl = document.createElement('title')
          titleEl.textContent = label || treatment

          curNode.appendChild(titleEl)
          treatmentNames.delete(treatment)

          // Illustrator, for some reason, makes all paths the child of
          // an anchor tag. That messes up our clicking business. We
          // could probably preventDefault() or stopPropagation()
          // somewhere, but I'm just removing them here.
          const replaceParent = (
            curNode.parentNode.nodeName.toLowerCase() === 'a' &&
            curNode.parentNode.children.length === 1
          )

          if (replaceParent) {
            anchorsToRemove.push(curNode.parentNode)
          }
        }

        break;
      }
    }

    // Remove ID, since multiple instances of this SVG will be in the
    // document. Alternatively, the whole thing could always be wrapped
    // in an iframe, but that would require inter-frame communication,
    // which seems like a pain in the ass.
    curNode.removeAttribute('id')
  }

  anchorsToRemove.forEach(el => {
    el.replaceWith(el.children[0])
  })

  return svgDoc.rootElement.outerHTML
}


// Actions ----------------

function initialize() {
  return async (dispatch, getState) => {
    dispatch(Action.Log('Checking browser compatibility...'))
    await dispatch(Action.CheckCompatibility)
    dispatch(Action.Log('Browser compatible.'))
    dispatch(Action.Log('Loading available projects...'))
    await dispatch(Action.LoadAvailableProjects)
    dispatch(Action.Log('Finished initialization. Starting application...'))

    const projectKey = Object.keys(getState().projects)[0]

    dispatch(Action.ChangeProject(projectKey))

    return {}
  }
}

function changeProject(projectURL) {
  return async (dispatch, getState) => {
    await dispatch(Action.ViewProject(projectURL))

    const project = getState().projects[projectURL]
        , { treatments } = project
        , [ treatmentA, treatmentB ] = Object.keys(treatments).slice(3)

    const persistedSavedGenes = JSON.parse(localStorage[projectURL + '-watched'] || '[]')

    dispatch(Action.SetPairwiseComparison(treatmentA, treatmentB))
    dispatch(Action.SetSavedGenes(persistedSavedGenes))

    return {}
  }
}

function checkCompatibility() {
  return () => {

    if (!window.indexedDB) {
      throw new Error('Browser does not support IndexedDB standard. Cannot run application.')
    }

    if (!window.Blob) {
      throw new Error('Browser does not support Blob standard. Cannot run application.')
    }

    return {}
  }
}

function loadAvailableProjects() {
  return async dispatch => {
    const loadedProjects = {}

    const projectsResp = await fetchWithoutCache('projects.json')

    if (!projectsResp.ok) {
      throw new Error("No project.json file available")
    }

    let projects

    try {
      projects = await projectsResp.json()
      if (!Array.isArray(projects)) throw new Error()
      dispatch(Action.Log(`Loading projects: ${projects.join(', ')}`))
    } catch (e) {
      throw new Error("projects.json file is malformed")
    }

    await Promise.all(projects.map(async projectBaseURL => {
      const log = message => dispatch(Action.Log(`${projectBaseURL}: ${message}`))
          , fetchResource = fetchProjectResource(projectBaseURL, log)
          , project = {}

      let success

      success = await fetchResource('project.json', {
        cache: false,
        async onRespOK(resp) {
          project.metadata = await resp.json()
          log('Loaded project metadata')
        },
      })

      if (!success) {
        log('Aborting.')
        return false
      }

      success = await fetchResource(project.metadata.treatments, {
        cache: false,
        async onRespOK(resp) {
          project.treatments = await resp.json()
          log(`Loaded treatments`)
        },
      })

      if (!success) {
        log('Aborting.')
        return false
      }

      await Promise.all([
        fetchResource(project.metadata.geneAliases, {
          onRespNotOK() {
            project.geneAliases = {}
            log('No gene aliases found')
          },
          async onRespOK(resp) {
            const aliases = await resp.text()

            project.geneAliases = R.pipe(
              R.split('\n'),
              R.map(R.pipe(
                R.split(','),
                arr => [arr[0], arr.slice(1)]
              )),
              R.fromPairs,
            )(aliases)

            log('Loaded gene aliases')
          },
        }),

        fetchResource(project.metadata.rpkmMeasures, {
          onRespNotOK() {
            project.rpkmsForTreatmentGene = R.always(null)
            log('No gene aliases found')
          },

          async onRespOK(resp) {
            const obj = await parseRPKMFile(resp, project.treatments)
            Object.assign(project, obj)
            log('Loaded gene RPKM measurements')
          },
        }),

        fetchResource(project.metadata.diagram, {
          cache: false,
          async onRespOK(resp) {
            project.svg = cleanSVGString(await resp.text(), project.treatments)
            log('Loaded SVG icon')
          },
        }),

        project.metadata.grid && fetchResource(project.metadata.grid, {
          cache: false,
          async onRespOK(resp) {
            let grid = d3.csvParseRows(await resp.text())

            grid = grid.map(row => row.map(treatment => {
              if (!treatment) return null

              if (!project.treatments.hasOwnProperty(treatment)) {
                throw new Error(`Treatment ${treatment} not in project ${projectBaseURL}`)
              }

              return treatment
            }))

            project.grid = grid;
          },
        }),

      ])

      log('Finished loading')

      project.baseURL = projectBaseURL
      project.pairwiseComparisonCache = {}
      loadedProjects[projectBaseURL] = project

      const corpus = {}
          , ts = new TrieSearch()

      project.genes.forEach(gene => {
        corpus[gene] = gene
      })

      Object.entries(project.geneAliases || {}).forEach(([ gene, aliases ]) => {
        aliases.forEach(alias => {
          corpus[alias] = gene
        })
      })

      ts.addFromObject(corpus);

      project.searchGenes = name => ts.get(name)
    }))

    const sortedLoadedProjects = {}

    projects.forEach(project => {
      if (loadedProjects.hasOwnProperty(project)) {
        sortedLoadedProjects[project] = loadedProjects[project]
      }
    })

    return { projects: sortedLoadedProjects }
  }
}

// Load the table produced by the edgeR function `exactTest`:
// <https://rdrr.io/bioc/edgeR/man/exactTest.html>
function setPairwiseComparison(treatmentAKey, treatmentBKey) {
  return async (dispatch, getState) => {
    const { project } = getState().currentView

    const cached = project.pairwiseComparisonCache[[treatmentAKey, treatmentBKey]]

    if (cached) {
      await delay(0);

      return {
        pairwiseData: cached,
        resort: true,
      }
    }

    const treatmentA = project.treatments[treatmentAKey]
        , treatmentB = project.treatments[treatmentBKey]

    if (!treatmentA) {
      throw new Error(`No such treatment: ${treatmentAKey}`)
    }

    if (!treatmentB) {
      throw new Error(`No such treatment: ${treatmentBKey}`)
    }

    const urlTemplate = project.metadata.pairwiseName || './pairwise_tests/%A_%B.txt'

    const fileURLA = path.join(
      project.baseURL,
      urlTemplate.replace('%A', treatmentAKey).replace('%B', treatmentBKey))

    const fileURLB = path.join(
      project.baseURL,
      urlTemplate.replace('%A', treatmentBKey).replace('%B', treatmentAKey))

    let reverse = false
      , resp

    const [ respA, respB ] = await Promise.all([
      fetch(fileURLA),
      fetch(fileURLB),
    ])

    if (respA.ok) {
      resp = respA
      reverse = true
    } else if (respB.ok) {
      resp = respB
    } else {
      throw new Error(`Could not download pairwise test from ${fileURLA} or ${fileURLB}`)
    }

    const text = await resp.text()

    const pairwiseData = text
      .trim()
      .split('\n')
      .slice(1) // Skip header
      .map(row => {
        const [ label, logFC, logCPM, pValue ] = row.split('\t')

        return [label, {
          label,
          logFC: (reverse ? -1 : 1 ) * parseFloat(logFC),
          logCPM: parseFloat(logCPM),
          pValue: parseFloat(pValue),
        }]
      })

    return {
      pairwiseData: new Map(pairwiseData),
      resort: true,
    }
  }
}

function updateDisplayedGenes(sortPath, order) {
  return (dispatch, getState) => {
    const view = getState().currentView

    const {
      project,
      savedGenes,
      brushedGenes,
      comparedTreatments,
      pairwiseData,
    } = view

    const { rpkmsForTreatmentGene } = project
        , [ treatmentA, treatmentB ] = comparedTreatments

    const listedGenes = brushedGenes.size
      ? brushedGenes
      : savedGenes

    const unsorted = [...listedGenes].map(geneName => {
      if (!pairwiseData) {
        return {
          gene: { label: geneName },
          saved: savedGenes.has(geneName),
        }
      }

      const gene = pairwiseData.get(geneName) || { label: geneName }

      const [
        treatmentA_RPKMMean,
        treatmentA_RPKMMedian,
        treatmentB_RPKMMean,
        treatmentB_RPKMMedian,
      ] = R.chain(
        rpkms => [d3.mean(rpkms), d3.median(rpkms)],
        [rpkmsForTreatmentGene(treatmentA, geneName), rpkmsForTreatmentGene(treatmentB, geneName)]
      )

      return {
        gene,
        treatmentA_RPKMMean,
        treatmentA_RPKMMedian,
        treatmentB_RPKMMean,
        treatmentB_RPKMMedian,
      }
    })

    if (!sortPath) sortPath = view.sortPath
    if (!order) order = view.order

    const getter =
      sortPath.includes('label')
        ? R.pipe(R.path(sortPath), R.toLower)
        : R.path(sortPath)

    const comparator = (order === 'asc' ? R.ascend : R.descend)(R.identity)

    const displayedGenes = R.sort(
      (a, b) => {
        a = getter(a)
        b = getter(b)

        if (a === undefined) return 1
        if (b === undefined) return -1

        return comparator(a, b)
      },
      unsorted
    )

    return { displayedGenes }
  }
}

function setSavedGenes(savedGenes) {
  return (dispatch, getState) => {
    const key = getState().currentView.project.baseURL + '-watched'
        , savedGenesStr = JSON.stringify([...savedGenes])

    localStorage.setItem(key, savedGenesStr)

    return { resort: true }
  }
}

function importSavedGenes(file) {
  return (dispatch, getState) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async e => {
      const text = e.target.result

      try {
        const importedWatchedGenes = text.trim().split('\n')

        // TODO: Filter out those things that aren't in `project.genes`

        const existingWatchedGenes = getState().currentView.savedGenes

        await dispatch(Action.SetSavedGenes(
          [...importedWatchedGenes, ...existingWatchedGenes]
        ))

        resolve({})
      } catch (e) {
        reject('didn\'t work')
      }
    }

    reader.readAsText(file)
  })
}

function exportSavedGenes() {
  return (dispatch, getState) => {
    const { savedGenes } = getState().currentView

    const blob = new Blob([ [...savedGenes].join('\n') ], { type: 'text/plain' })

    saveAs(blob, 'saved-genes.txt')

    return {}
  }
}
