import * as R from 'ramda'
import * as d3 from 'd3'
import { saveAs } from 'file-saver'
import { delay } from '../utils'

import { getTranscriptLookup, getAbundanceLookup } from '../projects'

import { createAction, createAsyncAction } from '../actions'

import {
  TreatmentName,
  TranscriptName,
  BulkPairwiseComparison,
  BulkDifferentialExpression,
  BulkDisplayedTranscriptsSource,
  BulkTableSortPath,
  TableSortOrder,
  BulkViewState,
  SingleCellViewState,
  ClusterDGE,
  TranscriptWithClusterDGE,
} from '../types'


import { projectForView } from '../utils'


// Load the table produced by the edgeR function `exactTest`:
// <https://rdrr.io/bioc/edgeR/man/exactTest.html>
export const setPairwiseComparison = createAsyncAction<
  {
    view: BulkViewState,
    treatmentAKey: string,
    treatmentBKey: string,
  },
  {
    pairwiseData: BulkPairwiseComparison,
    resort: boolean,
  }
>('set-pairwise-comparison', async (arg, { getState }) => {
  const { treatmentAKey, treatmentBKey, view } = arg
    , { project } = view

  const cacheKey = [treatmentAKey, treatmentBKey].toString()
      , cached = project.pairwiseComparisonCache[cacheKey]

  if (cached != null) {
    await delay(0);

    return {
      pairwiseData: cached,
      resort: true,
    }
  }

  const treatmentA = project.data.treatments.get(treatmentAKey)
      , treatmentB = project.data.treatments.get(treatmentBKey)

  if (!treatmentA) {
    throw new Error(`No such treatment: ${treatmentAKey}`)
  }

  if (!treatmentB) {
    throw new Error(`No such treatment: ${treatmentBKey}`)
  }

  const urlTemplate = project.config.pairwiseName || './pairwise_tests/%A_%B.txt'

  const fileURLA = new URL(
    urlTemplate.replace('%A', treatmentAKey).replace('%B', treatmentBKey),
    window.location.toString()
  ).href

  const fileURLB = new URL(
    urlTemplate.replace('%A', treatmentBKey).replace('%B', treatmentAKey),
    window.location.toString()
  ).href

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

  let minPValue = 1

  const getCanonicalTranscriptLabel = getTranscriptLookup(project)
      , abundancesForTreatmentTranscript = getAbundanceLookup(project)

  const pairwiseMap: Map<TranscriptName, BulkDifferentialExpression> = new Map(text
    .trim()
    .split('\n')
    .slice(1) // Skip header
    .map(row => {
      const [ id, logFC, logATA, _pValue ] = row.split('\t')

      if (
        id === undefined ||
        logFC === undefined ||
        logATA === undefined ||
        _pValue === undefined
      ) {
        throw new Error('Pairwise comparison file is malformed')
      }

      const pValue = parseFloat(_pValue)

      if (pValue !== 0 && !isNaN(pValue) && (pValue < minPValue)) {
        minPValue = pValue
      }

      const name = id
          , label = getCanonicalTranscriptLabel(name) || name

      const [
        treatmentA_AbundanceMean=null,
        treatmentA_AbundanceMedian=null,
        treatmentB_AbundanceMean=null,
        treatmentB_AbundanceMedian=null,
      ] = R.chain(
        abundances => abundances.length === 0
          ? [null, null]
          : [d3.mean(abundances), d3.median(abundances)],
        [abundancesForTreatmentTranscript(treatmentAKey, name), abundancesForTreatmentTranscript(treatmentBKey, name)]
      )

      return [name, {
        name,
        label,
        treatmentA_AbundanceMean,
        treatmentA_AbundanceMedian,
        treatmentB_AbundanceMean,
        treatmentB_AbundanceMedian,
        pValue,
        logFC: (reverse ? -1 : 1 ) * parseFloat(logFC),
        logATA: parseFloat(logATA),
      }]
    }))

  const pairwiseData: BulkPairwiseComparison = Object.assign(pairwiseMap, {
    minPValue,
    fcSorted: R.sortBy(x => x.logFC || 0, Array.from(pairwiseMap.values())),
    ataSorted: R.sortBy(x => x.logATA || 0, Array.from(pairwiseMap.values())),
  })

  return {
    pairwiseData,
    resort: true,
  }
})


export const getDefaultPairwiseComparison = createAsyncAction<
  {
    view: BulkViewState,
  },
  {
    treatmentA: TreatmentName;
    treatmentB: TreatmentName;
  }
>('get-default-pairwise-comparison', async (args, { getState }) => {
  const { view: { project } } = args
      , { treatments } = project.data
      , [ treatmentA, treatmentB ] = Array.from(treatments.keys())

  if (treatments.size < 2) {
    throw new Error('There need to be at least two treatments to compare')
  }

  return {
    treatmentA: treatmentA!,
    treatmentB: treatmentB!,
  }
})


export const updateSortForTreatments = createAsyncAction<
  {
    view: BulkViewState,
    sortPath: BulkTableSortPath | void,
    order: TableSortOrder | void
  },
  {
    sortedTranscripts: Array<BulkDifferentialExpression>,
    resort: boolean,
  }
>('update-sort-for-treatments', async (args, { getState }) => {
  const { sortPath, order, view } = args
      , { pairwiseData } = view
      , resolvedSortPath = sortPath || view.sortPath
      , resolvedOrder = order || view.order

  const getter =
    resolvedSortPath === 'label'
      ? (d: BulkDifferentialExpression) => d.label.toLowerCase()
      : (d: BulkDifferentialExpression) => d[resolvedSortPath]

  const comparator = (resolvedOrder === 'asc' ? R.ascend : R.descend)(R.identity)

  const sortedTranscripts = R.sort(
    (a, b) => {
      const aVal = getter(a)
          , bVal = getter(b)

      if (aVal === undefined) return 1
      if (bVal === undefined) return -1

      return comparator(aVal, bVal)
    },
    pairwiseData === null
      ? []
      : Array.from(pairwiseData.values())
  )

  return {
    sortedTranscripts,
    resort: true,
  }
})


function withinBounds(min: number, max: number, value: number | null) {
  if (value === null) return false
  return value >= min && value <= max
}

export const updateDisplayedTranscripts = createAsyncAction<
  {
    view: BulkViewState,
  },
  {
    displayedTranscripts: Array<BulkDifferentialExpression>,
    source: BulkDisplayedTranscriptsSource
  }
>('update-displayed-transcripts', async (args, { getState }) => {
  const { view } = args
      , { project } = view

  const {
    sortedTranscripts,
    savedTranscripts,
    pairwiseData,
    pValueThreshold,
    brushedArea,
    hoveredBinTranscripts,
    selectedBinTranscripts,
    sortPath,
    order,
  } = view

  if (pairwiseData === null) {
    throw new Error('Can\'t run without pairwise data')
  }


  let listedTranscripts: Set<TranscriptName> = new Set()

  let source: BulkDisplayedTranscriptsSource = 'all'

  if (pairwiseData && brushedArea) {
    const [ minLogATA, maxLogFC, maxLogATA, minLogFC ] = brushedArea

    const ok = (de: BulkDifferentialExpression) => {
      const { logFC, logATA, pValue } = de

      return (
        withinBounds(0, pValueThreshold, pValue) &&
        withinBounds(minLogATA, maxLogATA, logATA) &&
        withinBounds(minLogFC, maxLogFC, logFC)
      )
    }

    source = 'brushed'

    pairwiseData.forEach(transcript => {
      if (ok(transcript)) {
        listedTranscripts.add(transcript.name)
      }
    })
  } else if (selectedBinTranscripts) {
    source = 'selectedBin'
    listedTranscripts = selectedBinTranscripts
  } else if (hoveredBinTranscripts) {
    source = 'hoveredBin'
    listedTranscripts = hoveredBinTranscripts
  } else if (savedTranscripts.size) {
    source = 'watched'
    listedTranscripts = savedTranscripts
  } else {
    listedTranscripts = new Set(pairwiseData.keys())
  }

  let displayedTranscripts = sortedTranscripts
    .filter(({ name }) => listedTranscripts.has(name))

  const comparator = (order === 'asc' ? R.ascend : R.descend)(R.identity)

  const alphaSort = R.sort((a: BulkDifferentialExpression, b: BulkDifferentialExpression) =>
    comparator(a.label.toLowerCase(), b.label.toLowerCase()))

  const getCanonicalTranscriptLabel = getTranscriptLookup(project)

  const extraTranscripts: Array<BulkDifferentialExpression> = Array.from(listedTranscripts)
    .filter(name => !pairwiseData.has(name))
    .map(name => ({
      // FIXME
      name,
      label: getCanonicalTranscriptLabel(name) || name,

      treatmentA_AbundanceMean: null,
      treatmentA_AbundanceMedian: null,
      treatmentB_AbundanceMean: null,
      treatmentB_AbundanceMedian: null,
      pValue: null,
      logFC: null,
      logATA: null,
    }))

  displayedTranscripts = [...displayedTranscripts, ...alphaSort(extraTranscripts)]

  // If anything but the name is being sorted on (i.e. any of the fields
  // which would have a numerical value), then just add all of these extra
  // transcripts to the bottom of the list. Otherwise, resort the whole list
  // alphabetically. (This routine used to combine the two alphabetically
  // sorted lists progressively, but now we just resort the whole concatenated
  // list. If it's a bottleneck, we can go back to doing the old way.

  if (sortPath === 'label') {
    displayedTranscripts = alphaSort(displayedTranscripts)
  }

  return {
    displayedTranscripts,
    source,
  }
})

export const updateDisplayedSingleCellTranscripts = createAsyncAction<
  {
    view: SingleCellViewState,
  },
  {
    displayedTranscripts: TranscriptWithClusterDGE[]
  }
>('update-displayed-sc-transcripts', async (args, { getState }) => {
  const { selectedClusters, project } = args.view

  if (!selectedClusters) {
    return {
      displayedTranscripts: [],
    }
  }

  const dgesByTranscript: Map<string, Set<ClusterDGE>> = new Map()

  project.data.differentialExpressions.forEach(dge => {
    if (!selectedClusters.has(dge.clusterID)) return

    if (!dgesByTranscript.has(dge.transcriptID)) {
      dgesByTranscript.set(dge.transcriptID, new Set())
    }

    dgesByTranscript.get(dge.transcriptID)!.add(dge)
  })

  const displayedTranscripts = [...dgesByTranscript].map(([ transcript, clusters ]) => ({
    transcript,
    dgeByCluster: new Map([...clusters].map(cluster => [ cluster.clusterID, cluster ]))
  }))

  return {
    displayedTranscripts,
  }
})

function getGlobalWatchedGenesKey() {
  return window.location.pathname + '-watched'
}

export const setSavedTranscripts = createAsyncAction<
  { transcriptNames: Array<TranscriptName> },
  { resort: boolean }
>('set-saved-transcripts', async (arg, { getState }) => {
  const { transcriptNames } = arg

  if (R.path(['view', 'source', 'key'], getState()) === 'global') {
    const key = getGlobalWatchedGenesKey()
        , savedTranscriptsStr = JSON.stringify([...transcriptNames])

    localStorage.setItem(key, savedTranscriptsStr)
  }

  return { resort: true }
})


type ImportedTranscript = [
  name: string,
  canonicalName: string,
]

// FIXME: Make this generic across projects
export const importSavedTranscripts = createAsyncAction<
  {
    text: string
  },
  {
    imported: Array<ImportedTranscript>,
    skipped: Array<string>,
  }
>('import-saved-transcripts', async (arg, { getState }) => {
  const { text } = arg
      , { view } = getState()

  if (view === null) {
    throw new Error('Can\'t import transcripts without active view')
  }
  const rows = d3.tsvParseRows(text.trim())

  if (R.path([0, 0], rows) === 'Gene name') {
    rows.shift()
  }

  const transcriptsInFile = rows.map(row => row[0])
      , project = projectForView(getState(), 'Bulk')
      , getCanonicalTranscriptLabel = getTranscriptLookup(project)
      , newWatchedTranscripts = []
      , imported: Array<ImportedTranscript> = []
      , skipped: Array<string> = []

  for (const t of transcriptsInFile) {
    if (t === undefined) continue

    const canonicalName = getCanonicalTranscriptLabel(t)

    if (canonicalName) {
      imported.push([t, canonicalName])
      newWatchedTranscripts.push(canonicalName)
    } else {
      skipped.push(t)
    }
  }

  // FIXME
  /*
  const existingWatchedTranscripts = view.savedTranscripts
  await dispatch(Action.SetSavedTranscripts(
    [...newWatchedTranscripts, ...existingWatchedTranscripts]
  ))
  */

  return {
    imported,
    skipped,
  }
})


// FIXME: Make this generic across projects
export const exportSavedTranscripts = createAsyncAction<
  {
    view: BulkViewState,
  },
  void
>('export-saved-transcripts', async (args, { getState }) => {
  const { view } = args
      , { comparedTreatments, displayedTranscripts } = view

  if (comparedTreatments === null || displayedTranscripts === null) {
    return
  }

  const [ treatmentA, treatmentB ] = comparedTreatments

  const header = [
    'Gene name',
    'pValue',
    'logATA',
    'logFC',
    `${treatmentA} mean abundance`,
    `${treatmentA} median abundance`,
    `${treatmentB} mean abundance`,
    `${treatmentB} median abundance`,
  ]

  const formatNumRow = (x: number | null) =>
    x === null
      ? ''
      : x.toString()

  const rows = displayedTranscripts.transcripts.map(row => ([
    row.name,
    formatNumRow(row.pValue),
    formatNumRow(row.logATA),
    formatNumRow(row.logFC),
    formatNumRow(row.treatmentA_AbundanceMean),
    formatNumRow(row.treatmentA_AbundanceMedian),
    formatNumRow(row.treatmentB_AbundanceMean),
    formatNumRow(row.treatmentB_AbundanceMedian),
  ]))

  const tsv = d3.tsvFormatRows([header, ...rows])

  const blob = new Blob([ tsv ], { type: 'text/tab-separated-values' })

  saveAs(blob, 'saved-transcripts.tsv')
})


// FIXME: The following two actions are identical, maybe merge them and add a discriminant
export const setHoveredBinTranscripts = createAction(
  'set-hovered-bin-transcripts', (transcripts: Set<TreatmentName> | null) => {
    return {
      payload: {
        transcripts,
        resort: true,
      },
    }
  }
)


export const setSelectedBinTranscripts = createAction(
  'set-selected-bin-transcripts', (transcripts: Set<TreatmentName> | null) => {
    return {
      payload: {
        transcripts,
        resort: true,
      },
    }
  }
)


type Coords = [number, number, number, number]

export const setBrushedArea = createAction(
  'set-brushed-area', (coords: Coords | null) => {
    return {
      payload: {
        coords,
        resort: true,
      },
    }
  }
)


export const setHoveredTranscript = createAction<
  { transcript: TranscriptName | null }
>('set-hovered-transcript')


export const setHoveredTreatment = createAction<
  { treatment: TreatmentName | null }
>('set-hovered-treatment')


export const setFocusedTranscript = createAction<
  { transcript: TranscriptName | null }
>('set-focused-transcript')


export const setPValueThreshold = createAction(
  'set-p-value-threshold', (threshold: number) => {
    if (threshold > 1) threshold = 1;

    if (threshold < 0) threshold = 0;

    return {
      payload: {
        threshold,
        resort: true,
      },
    }
  }
)

export const setSelectedClusters = createAction<
  { clusters: Set<string> | null }
>('set-selected-clusters')
