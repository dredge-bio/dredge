"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , getAlternateGeneNamesSeq = require('../utils/get_alternate_gene_names')
    , Application = require('./application')


function CurrentStep ({
  stepNumber,
  currentStepNumber,
  message,
}) {
  return (
    h('li', { className: stepNumber <= currentStepNumber ? "black" : "gray" }, [
      message,

      h('span', { className: 'ml1' }, [
        stepNumber === currentStepNumber && h('span', '....'),
        stepNumber < currentStepNumber && h('span', { className: 'green' }, 'OK'),
      ]),
    ])
  )
}

module.exports = React.createClass({
  displayName: 'Setup',

  propTypes: {},

  getInitialState() {
    return {
      cellGeneExpressionData: null,
      currentStep: 0,
      error: null,
    }
  },

  componentDidMount() {
    Promise.resolve()
      .then(this.checkIDBCompatibility)
      .then(this.parseCellGeneMeasures)
      .then(() => {
        setTimeout(() => this.setState({ currentStep: 3 }), 400)
      })
      .catch(error => {
        this.setState({ error })
      })
  },

  checkIDBCompatibility() {
    new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject('Browser does not support indexedDB standard.')
      } else if (!window.Blob) {
        reject('Browser does not support Blob standard.')
      } else {
        this.setState({ currentStep: 1 }, resolve)
      }
    })
  },

  parseCellGeneMeasures() {
    const db = require('../db')()

    const measures = new Promise((resolve, reject) => {
      db.datasets.get('cellGeneMeasuress', ({ blob }) => {
        const reader = new FileReader()

        reader.onloadend = () => {
          this.setState({
            cellGeneExpressionData: JSON.parse(reader.result),
          })

          resolve()
        }
        reader.onerror = err => reject(err)

        reader.readAsText(blob)
      })
    })

    const alternateNames = getAlternateGeneNamesSeq().then(alternateNamesMap => {
      const alternateGeneNamesSeq = alternateNamesMap.toSeq().cacheResult()

      this.setState({
        alternateGeneNames: alternateNamesMap,
        alternateGeneNamesSeq,
      })
    })

    return Promise.all([measures, alternateNames]).then(() => {
      return new Promise(resolve => {
        this.setState({ currentStep: 2 }, resolve)
      })
    })
  },

  render() {
    const {
      currentStep,
      cellGeneExpressionData,
      alternateGeneNames,
      alternateGeneNamesSeq,
    } = this.state

    return h('main', [
      currentStep < 3 && h('div.m3', [
        h('h1.m0', 'Initializing application'),
        h('ol', [
          h(CurrentStep, {
            stepNumber: 0,
            currentStepNumber: currentStep,
            message: 'Confirming browser compatibility',
          }),
          h(CurrentStep, {
            stepNumber: 1,
            currentStepNumber: currentStep,
            message: 'Downloading cell-gene-measures',
          }),
          h(CurrentStep, {
            stepNumber: 2,
            currentStepNumber: currentStep,
            message: 'Starting application',
          }),
        ]),
      ]),

      currentStep === 3 && cellGeneExpressionData && h(Application, {
        cellGeneExpressionData,
        alternateGeneNames,
        alternateGeneNamesSeq,
      }),

    ])
  },
})
