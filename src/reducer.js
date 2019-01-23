"use strict";

const R = require('ramda')

function view(project) {
  return {
    project,
    loading: false,

    comparedTreatments: null,
    pairwiseData: null,

    pValueThreshold: 1,

    focusedGene: null,
    hoveredGene: null,
    hoveredTreatment: null,

    savedGenes: new Set(),
    brushedGenes: new Set(),

    displayedGenes: null,
    order: 'asc',
    sortPath: ['gene', 'label'],
  }
}

function initialState() {
  return {
    initialized: false,
    compatible: null,
    log: {},

    projects: null,
    currentView: null,
  }
}

module.exports = function reducer(state=initialState(), action) {
  if (!action.readyState) return state

  return action.readyState.case({
    Success: resp => action.type.case({
      Initialize() {
        return state
        return R.assoc('initialized', true, state)
      },

      Log() {
        const { project='', resourceName='', resourceURL='', status } = action.type

        return R.set(
          R.lensPath(['log', project || '', resourceURL]),
          { status, url: resourceURL, label: resourceName },
          state
        )
      },

      LoadAvailableProjects() {
        return R.assoc('projects', resp.projects, state)
      },

      CheckCompatibility() {
        return R.assoc('compatible', true, state)
      },

      ChangeProject() {
        return state
      },

      ViewProject(projectBaseURL) {
        const project = state.projects[projectBaseURL]

        return R.assoc('currentView', view(project), state)
      },

      SetPairwiseComparison(treatmentA, treatmentB) {
        const { pairwiseData } = resp

        return R.pipe(
          R.over(R.lensProp('currentView'), R.pipe(
            R.assoc('loading', false),
            R.assocPath(
              ['project', 'pairwiseComparisonCache', [treatmentA, treatmentB]],
              pairwiseData
            ),
            R.flip(R.merge)({
              pairwiseData,
              comparedTreatments: [treatmentA, treatmentB],
              brushedGenes: new Set(),
            })
          ))
        )(state)
      },

      UpdateDisplayedGenes(sortPath, order) {
        const { displayedGenes } = resp

        const updated = { displayedGenes }

        if (sortPath) {
          updated.sortPath = sortPath
        }

        if (order) {
          updated.order = order
        }

        return R.over(
          R.lensProp('currentView'),
          R.flip(R.merge)(updated),
          state
        )
      },

      SetHoveredGene(geneName) {
        return R.assocPath(
          ['currentView', 'hoveredGene'],
          geneName,
          state
        )
      },


      SetBrushedGenes(geneNames) {
        return R.assocPath(
          ['currentView', 'brushedGenes'],
          new Set(geneNames),
          state
        )
      },

      SetSavedGenes(geneNames) {
        const { currentView: { brushedGenes, focusedGene, savedGenes, hoveredGene }} = state
            , nextSavedGenes = new Set(geneNames)

        let nextFocusedGene = focusedGene
          , nextHoveredGene = hoveredGene

        if (!nextSavedGenes.has(hoveredGene)) {
          nextHoveredGene = null
        }

        // If we're viewing saved genes, and the focused gene has been removed
        // from the saved genes, then move focus to the next one (if it exists)
        const moveFocusedGene = (
          focusedGene &&
          !brushedGenes.size &&
          savedGenes.has(focusedGene) &&
          !nextSavedGenes.has(focusedGene)
        )

        if (moveFocusedGene && nextSavedGenes.size === 0) {
          nextFocusedGene = null
        } else if (moveFocusedGene) {
          const savedGenesArr = [...savedGenes]
              , idx = savedGenesArr.indexOf(focusedGene)
              , inNextSaved = gene => nextSavedGenes.has(gene)

          // First search for the next one from the list of previous genes
          // that's in the next one
          nextFocusedGene = R.find(inNextSaved, savedGenesArr.slice(idx))

          // If there's nothing available, then go backwards
          if (!nextFocusedGene) {
            nextFocusedGene = R.find(inNextSaved, savedGenesArr.slice(0, idx).reverse())
          }

          // If there's nothing found, then focus on the first of the new saved
          // genes
          nextFocusedGene = [...nextSavedGenes][0]
        }

        return R.over(R.lensProp('currentView'), R.flip(R.merge)({
          savedGenes: nextSavedGenes,
          focusedGene: nextFocusedGene,
          hoveredGene: nextHoveredGene,
        }), state)
      },

      SetFocusedGene(geneName) {
        return R.assocPath(
          ['currentView', 'focusedGene'],
          geneName,
          state
        )
      },

      SetPValueThreshold(threshold) {
        return R.assocPath(
          ['currentView', 'pValueThreshold'],
          threshold,
          state
        )
      },

      SetHoveredTreatment(treatmentName) {
        return R.assocPath(
          ['currentView', 'hoveredTreatment'],
          treatmentName,
          state
        )
      },

      ImportSavedGenes: R.always(state),
      ExportSavedGenes: R.always(state),
    }),

    Pending: () => action.type.case({
      SetPairwiseComparison() {
        return R.assocPath(['currentView', 'loading'], true, state)
      },

      _: R.always(state),
    }),

    Failure: err => action.type.case({
      SetPairwiseComparison(treatmentA, treatmentB) {
        return R.pipe(
          R.over(R.lensProp('currentView'), R.pipe(
            R.assoc('loading', false),
            R.flip(R.merge)({
              pairwiseData: null,
              comparedTreatments: [treatmentA, treatmentB],
              brushedGenes: new Set(),
            })
          ))
        )(state)
      },

      CheckCompatibility() {
        return R.set('compatible', false, state)
      },
      _: () => {
        // eslint-disable-next-line no-console
        console.error(err)
        return state
      },
    }),
  })
}
