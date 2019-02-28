"use strict";

const R = require('ramda')
    , d3 = require('d3')
    , isURL = require('is-url')
    , { makeTypedAction } = require('org-async-actions')
    , saveAs = require('file-saver')
    , { LoadingStatus } = require('./types')

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
      project: d => typeof d === 'string' || d === null,
      resourceName: d => typeof d === 'string' || d === null,
      resourceURL: d => typeof d === 'string' || d === null,
      status: LoadingStatus,
    },
    response: {},
  },

  ResetLog: {
    exec: R.always({}),
    request: {
      project: d => typeof d === 'string' || d === null,
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
    response: {},
  },

  // FIXME: this is dumb
  ResetViewedProject: {
    exec: R.always({}),
    request: {},
    response: {},
  },

  LoadRemoteProject: {
    exec: loadRemoteProject,
    request: {
      projectKey: String,
    },
    response: {
      savedTranscripts: Object,
    },
  },

  UpdateProject: {
    exec: R.always({}),
    request: {
      projectKey: String,
      update: Function,
    },
    response: {},
  },

  GetDefaultProject: {
    exec: getDefaultProject,
    request: {},
    response: {
      projectKey: String,
    },
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

  GetDefaultPairwiseComparison: {
    exec: getDefaultPairwiseComparison,
    request: {
      projectKey: String,
    },
    response: {
      treatmentA: String,
      treatmentB: String,
    },
  },


  UpdateDisplayedTranscripts: {
    exec: updateDisplayedTranscripts,
    request: {
      sortPath: d => d == null || Array.isArray(d),
      order: d => d == null || d === 'asc' || d === 'desc',
    },
    response: {
      displayedTranscripts: Object,
    },
  },

  SetSavedTranscripts: {
    exec: setSavedTranscripts,
    request: {
      transcriptNames: isIterable,
    },
    response: {
      resort: Boolean,
    },
  },

  SetBrushedTranscripts: {
    exec: R.always({ resort: true }),
    request: {
      transcriptNames: isIterable,
    },
    response: {
      resort: Boolean,
    },
  },

  SetHoveredTranscript: {
    exec: R.always({}),
    request: {
      transcriptName: d => typeof d === 'string' || d === null,
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

  SetFocusedTranscript: {
    exec: R.always({}),
    request: {
      transcriptName: String,
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

  ImportSavedTranscripts: {
    exec: importSavedTranscripts,
    request: {
      file: Object,
    },
    response: {},
  },

  ExportSavedTranscripts: {
    exec: exportSavedTranscripts,
    request: {},
    response: {},
  },
})

const metadataFields = {
  label: {
    label: 'Project label',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Must be a string')
      }
    },
  },

  url: {
    label: 'Project URL',
    test: val => {
      if (!isURL(val)) {
        throw new Error('Value should be a URL')
      }
    },
  },

  readme: {
    label: 'Project Readme',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Value should be a URL pointing to a file')
      }
    },
  },

  abundanceMeasures: {
    label: 'Treatment abundance measures',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Value should be a URL pointing to a file')
      }
    },
  },

  abundanceLimits: {
    label: 'Limits for abundance mesaures',
    test: val => {
      const isArrayOfTwo = val => Array.isArray(val) && val.length === 2

      const ok = (
        isArrayOfTwo(val) &&
        isArrayOfTwo(val[0]) &&
        isArrayOfTwo(val[1]) &&
        typeof val[0][0] === 'number' &&
        typeof val[0][1] === 'number' &&
        typeof val[1][0] === 'number' &&
        typeof val[1][1] === 'number'
      )

      if (!ok) {
        throw new Error('Value must be an array of an array of two numbers')
      }
    },
  },

  treatments: {
    label: 'Treatment descriptions',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Value should be a URL pointing to a file')
      }
    },
  },

  pairwiseName: {
    label: 'Pairwise file naming format',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Value should be a URL pointing to a file')
      }

      if (!(val.includes('%A') && val.includes('%B'))) {
        throw new Error('Value should be a template for loading pairwise comparisons, using %A and %B as placeholders.')
      }
    },
  },

  transcriptAliases: {
    label: 'Alternate names for transcripts',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Value should be a URL pointing to a file')
      }
    },
  },

  diagram: {
    label: 'Project diagram',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Value should be a URL pointing to a file')
      }
    },
  },

  grid: {
    label: 'Project grid',
    test: val => {
      if (typeof val !== 'string') {
        throw new Error('Value should be a URL pointing to a file')
      }
    },
  },
}

function trim(x) {
  return x.trim()
}

function notBlank(x) {
  return x
}

const fileMetadata = {
  transcriptAliases: {
    label: 'Transcript aliases',
    exec: async url => {
      const resp = await fetchResource(url)

      try {
        const aliases = await resp.text()
            , transcriptAliases = {}

        let i = 0;
        for (const line of aliases.split('\n')) {
          const [ canonical, ...others ] = line.split(/\t|,/).map(trim).filter(notBlank)
          transcriptAliases[canonical] = others
          i++
          if (i % 1500 === 0) await delay(0)
        }

        return { transcriptAliases }
      } catch (e) {
        throw new Error('Error parsing file')
      }
    },
  },

  abundanceMeasures: {
    label: 'Transcript abundance measures',
    exec: async (url, treatments) => {
      const resp = await fetchResource(url)

      try {
        return await parseAbundanceFile(resp, treatments)
      } catch (e) {
        throw new Error('Error parsing file')
      }
    },
  },

  diagram: {
    label: 'SVG diagram',
    exec: async (url, treatments) => {
      const resp = await fetchResource(url, false)

      try {
        const svg = cleanSVGString(await resp.text(), treatments)

        return { svg }
      } catch (e) {
        throw new Error('Error parsing file')
      }
    },
  },

  grid: {
    label: 'Transcript grid',
    exec: async (url, treatments) => {
      const resp = await fetchResource(url, false)

      try {
        let grid = d3.csvParseRows(await resp.text())

        grid = grid.map(row => row.map(treatment => {
          if (!treatment) return null

          if (!treatments.hasOwnProperty(treatment)) {
            const e = new Error()
            e.reason = `Treatment ${treatment} not in project`
            throw e;
          }

          return treatment
        }))

        return { grid }
      } catch (e) {
        let message = 'Error parsing file'

        if (e.reason) {
          message += `: ${e.reason}`
        }

        throw new Error(message)
      }
    },
  },
}

function delay(time) {
  if (time === 0 && window.setTimeout) {
    return new Promise(resolve => setImmediate(resolve))
  } else {
    return new Promise(resolve => setTimeout(resolve, time))
  }
}

async function fetchResource(url, cache=true) {
  const headers = new Headers()

  if (!cache) {
    headers.append('Cache-Control', 'no-cache')
  }

  const resp = await fetch(url, { headers })

  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error('File not found')
    }

    throw new Error(`Error requesting file (${resp.statusText || resp.status })`)
  }

  return resp
}

async function parseAbundanceFile(resp) {
  const abundanceRows = (await resp.text()).split('\n')
      , replicates = abundanceRows.shift().split('\t').slice(1)
      , transcripts = []
      , abundances = []

  let i = 0

  for (let row of abundanceRows) {
    row = row.split('\t')
    transcripts.push(row.shift())
    abundances.push(row.map(parseFloat))
    i++

    if (i % 1000 === 0) await delay(0)
  }

  return {
    transcripts,
    replicates,
    abundances,
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
    if (getState().initialized) return {}

    await dispatch(Action.LoadAvailableProjects)

    return {}
  }
}

function getDefaultProject() {
  return async (dispatch, getState) => {
    return {
      projectKey: Object.keys(getState().projects)[0],
    }
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

function getDefaultPairwiseComparison(projectKey) {
  return async (dispatch, getState) => {
    const project = getState().projects[projectKey]
        , { treatments } = project
        , [ treatmentA, treatmentB ] = Object.keys(treatments)

    return {
      treatmentA,
      treatmentB,
    }
  }
}

function loadRemoteProject(projectKey) {
  return async (dispatch, getState) => {
    if (projectKey === '__LOCAL') {
      const localProjectData = JSON.parse(localStorage.getItem('local-project'))
          , metadata = R.omit(['baseURL'], localProjectData)

      localStorage.removeItem(projectKey + '-watched')

      let resolvedBaseURL = localProjectData.baseURL
      if (!resolvedBaseURL.endsWith('/')) resolvedBaseURL += '/'
      resolvedBaseURL = new URL(resolvedBaseURL, window.location.href).href

      await dispatch(Action.ResetLog(projectKey))

      await dispatch(Action.UpdateProject(
        projectKey,
        R.always({
          id: projectKey,
          baseURL: resolvedBaseURL,
          metadata,
        })
      ))
    }

    const {
      metadata,
      baseURL,
      loaded,
    } = R.path(['projects', projectKey], getState())


    if (!loaded) {
      await dispatch(Action.UpdateProject(
        projectKey,
        project => Object.assign({}, project, { loading: true })))


      const onUpdate = val => dispatch(Action.UpdateProject(
        projectKey,
        project => Object.assign({}, project, val)))

      const makeLog = (label, url) => async status => {
        await delay(0)
        return dispatch(Action.Log(
          projectKey,
          label,
          url,
          status
        ))
      }

      try {
        await loadProject(baseURL, metadata, makeLog, onUpdate)
      } catch (e) {

        await dispatch(Action.UpdateProject(
          projectKey,
          project => Object.assign({}, project, { loading: false, failed: true })))

        return { savedTranscripts: new Set() }
      }

      const project = R.path(['projects', projectKey], getState())

      const corpus = {}
          , corpusVals = []

      const log = makeLog('Transcript corpus', null)

      {

        await log(LoadingStatus.Pending(null))

        let i = 0
        for (const [ transcript, aliases ] of Object.entries(project.transcriptAliases || {})) {
          [...aliases, transcript].forEach(alias => {
            corpus[alias] = transcript
            corpusVals.push([alias, transcript])
          })

          i++
          if (i % 300 === 0) await delay(0)
        }

        i = 0
        if (project.transcripts) {
          project.transcripts.forEach(transcript => {
            if (!(transcript in corpus)) {
              corpus[transcript] = transcript
              corpusVals.push([transcript, transcript])
            }
          })
          i++
          if (i % 300 === 0) await delay(0)
        }

      }

      const searchTranscripts = (name, limit=20) => {
        const results = []

        for (const x of corpusVals) {
          if (x[0].startsWith(name)) {
            results.push({
              alias: x[0],
              canonical: x[1],
            })

            if (results.length === limit) break;
          }
        }

        return results
      }

      const getCanonicalTranscriptLabel = transcript => corpus[transcript]

      const transcriptIndices = {}
          , replicateIndices = {}

      {
        let i = 0
        for (const t of project.transcripts) {
          transcriptIndices[getCanonicalTranscriptLabel(t)] = i;
          i++
          if (i % 500 === 0) await delay(0)
        }
      }

      {
        let i = 0
        for (const r of project.replicates) {
          replicateIndices[r] = i;
          i++
          if (i % 500 === 0) await delay(0)
        }
      }

      await log(LoadingStatus.OK(null))

      const abundancesForTreatmentTranscript = (treatmentID, transcriptName) => {
        const treatment = project.treatments[treatmentID]
            , transcriptIdx = transcriptIndices[getCanonicalTranscriptLabel(transcriptName)]

        return treatment.replicates.map(replicateID => {
          const replicateIdx = replicateIndices[replicateID]
          return project.abundances[transcriptIdx][replicateIdx]
        })
      }

      await dispatch(Action.UpdateProject(
        projectKey,
        project => Object.assign({}, project, {
          loaded: true,
          loading: false,
          pairwiseComparisonCache: {},
          searchTranscripts,
          getCanonicalTranscriptLabel,
          abundancesForTreatmentTranscript,
        })))
    }

    const savedTranscriptKey = projectKey + '-watched'

    const savedTranscripts = new Set(
      JSON.parse(localStorage[savedTranscriptKey] || '[]'))

    return { savedTranscripts }
  }
}

async function loadProject(baseURL, metadata, makeLog, onUpdate) {
  let failed = false
    , treatments

  // Load treatments before anything else
  {
    const url = new URL(metadata.treatments, baseURL).href
        , log = makeLog('Project treatments', url)

    await log(LoadingStatus.Pending(null))

    try {
      const resp = await fetchResource(url, false)

      try {
        treatments = await resp.json()

        await onUpdate({ treatments })

      } catch (e) {
        failed = true
        throw new Error('Project treatments malformed')
      }
      await log(LoadingStatus.OK(null))
    } catch (e) {
      failed = true
      await log(LoadingStatus.Failed(e.message))
    }
  }

  if (failed) {
    throw new Error('Could not load project because treatments not available')
  }

  await Promise.all(Object.entries(fileMetadata).map(async ([ k, v ]) => {
    let url = metadata[k]

    if (!url) {
      makeLog(v.label, null)(LoadingStatus.Missing('No filename specified.'))
      return;
    }

    url = new URL(url, baseURL).href
    const log = makeLog(v.label, url)

    await log(LoadingStatus.Pending(null))

    try {
      const val = await v.exec(url, treatments)
      await onUpdate(val)
      await log(LoadingStatus.OK(null))
    } catch(e) {
      await log(LoadingStatus.Failed(e.message))
    }
  }))
}

function loadAvailableProjects() {
  return async (dispatch) => {
    const makeLog = R.curry((projectKey, label, url, status) => {
      return dispatch(Action.Log(
        projectKey,
        label,
        url,
        status
      ))
    })

    let projects

    {
      const log = makeLog(null, 'Projects', 'projects.json')

      await log(LoadingStatus.Pending(null))

      try {
        const resp = await fetchResource('projects.json', false)

        try {
          projects = await resp.json()
          if (typeof projects !== 'object') throw new Error()
        } catch (e) {
          throw new Error('projects.json file is malformed')
        }

        await log(LoadingStatus.OK(`Found ${projects.length} projects`))
      } catch (e) {
        await log(LoadingStatus.Failed(e.message))
      }
    }

    await Promise.all(Object.entries(projects || {}).map(async ([ projectKey, configURL ]) => {
      configURL = new URL(configURL, window.location.href).href

      const baseURL = new URL('./', configURL).href

      const makeProjectLog = makeLog(projectKey)

      dispatch(Action.UpdateProject(
        projectKey,
        R.always({
          id: projectKey,
          baseURL,
        })
      ))

      let loadedMetadata = {}

      {
        const log = makeProjectLog('Project metadata', configURL)

        await log(LoadingStatus.Pending(null))

        try {
          const resp = await fetchResource(configURL, false)

          try {
            loadedMetadata = await resp.json()
          } catch (e) {
            throw new Error('Project metadata malformed')
          }

          await log(LoadingStatus.OK(null))
        } catch (e) {
          await log(LoadingStatus.Failed(e.message))
          return;
        }
      }

      {
        await Promise.all(Object.entries(metadataFields).map(async ([ key, { label, test }]) => {
          const url = new URL(`project.json#${key}`, baseURL).href
              , log = makeProjectLog(label, url)

          await log(LoadingStatus.Pending(null))

          const val = loadedMetadata[key]

          if (!val) {
            await log(LoadingStatus.Missing('No value specified'))
            return
          }

          try {
            test(val);

            await log(LoadingStatus.OK(null))

            await dispatch(Action.UpdateProject(
              projectKey,
              R.assocPath(['metadata', key], val)
            ))
          } catch (e) {
            await log(LoadingStatus.Failed(e.message))
          }
        }))
      }
    }))

    await delay(100)

    return {}
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

    const fileURLA = new URL(
      urlTemplate.replace('%A', treatmentAKey).replace('%B', treatmentBKey),
      project.baseURL).href

    const fileURLB = new URL(
      urlTemplate.replace('%A', treatmentBKey).replace('%B', treatmentAKey),
      project.baseURL).href

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
        const [ id, logFC, logATA, pValue ] = row.split('\t')

        const name = project.getCanonicalTranscriptLabel(id)

        return [name, {
          name,
          logFC: (reverse ? -1 : 1 ) * parseFloat(logFC),
          logATA: parseFloat(logATA),
          pValue: parseFloat(pValue),
        }]
      })

    return {
      pairwiseData: new Map(pairwiseData),
      resort: true,
    }
  }
}

function updateDisplayedTranscripts(sortPath, order) {
  return (dispatch, getState) => {
    const view = getState().currentView

    const {
      project,
      savedTranscripts,
      brushedTranscripts,
      comparedTreatments,
      pairwiseData,
    } = view

    const { abundancesForTreatmentTranscript } = project
        , [ treatmentA, treatmentB ] = comparedTreatments

    const listedTranscripts = brushedTranscripts.size
      ? brushedTranscripts
      : savedTranscripts

    const unsorted = [...listedTranscripts].map(transcriptName => {
      if (!pairwiseData) {
        return {
          transcript: { name: transcriptName },
          saved: savedTranscripts.has(transcriptName),
        }
      }

      const transcript = pairwiseData.get(transcriptName) || {
        name: project.getCanonicalTranscriptLabel(transcriptName),
      }

      const [
        treatmentA_AbundanceMean,
        treatmentA_AbundanceMedian,
        treatmentB_AbundanceMean,
        treatmentB_AbundanceMedian,
      ] = R.chain(
        abundances => [d3.mean(abundances), d3.median(abundances)],
        [abundancesForTreatmentTranscript(treatmentA, transcriptName), abundancesForTreatmentTranscript(treatmentB, transcriptName)]
      )

      return {
        transcript,
        treatmentA_AbundanceMean,
        treatmentA_AbundanceMedian,
        treatmentB_AbundanceMean,
        treatmentB_AbundanceMedian,
      }
    })

    if (!sortPath) sortPath = view.sortPath
    if (!order) order = view.order

    const getter =
      sortPath.includes('name')
        ? R.pipe(R.path(sortPath), R.toLower)
        : R.path(sortPath)

    const comparator = (order === 'asc' ? R.ascend : R.descend)(R.identity)

    const displayedTranscripts = R.sort(
      (a, b) => {
        a = getter(a)
        b = getter(b)

        if (a === undefined) return 1
        if (b === undefined) return -1

        return comparator(a, b)
      },
      unsorted
    )

    return { displayedTranscripts }
  }
}

function setSavedTranscripts(savedTranscripts) {
  return (dispatch, getState) => {
    const key = getState().currentView.project.id + '-watched'
        , savedTranscriptsStr = JSON.stringify([...savedTranscripts])

    localStorage.setItem(key, savedTranscriptsStr)

    return { resort: true }
  }
}

function importSavedTranscripts(file) {
  return (dispatch, getState) => new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async e => {
      const text = e.target.result

      try {
        const importedWatchedTranscripts = text.trim().split('\n')

        // TODO: Filter out those things that aren't in `project.transcripts`

        const existingWatchedTranscripts = getState().currentView.savedTranscripts

        await dispatch(Action.SetSavedTranscripts(
          [...importedWatchedTranscripts, ...existingWatchedTranscripts]
        ))

        resolve({})
      } catch (e) {
        reject('didn\'t work')
      }
    }

    reader.readAsText(file)
  })
}

function exportSavedTranscripts() {
  return (dispatch, getState) => {
    const { savedTranscripts } = getState().currentView

    const blob = new Blob([ [...savedTranscripts].join('\n') ], { type: 'text/plain' })

    saveAs(blob, 'saved-transcripts.txt')

    return {}
  }
}
