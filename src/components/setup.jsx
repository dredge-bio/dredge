"use strict";

var React = require('react')
  , getAlternateGeneNamesSeq = require('../utils/get_alternate_gene_names')
  , CurrentStep


CurrentStep = ({
  stepNumber,
  currentStepNumber,
  message
}) => (
  <li className={stepNumber <= currentStepNumber ? "black" : "gray"}>
    { message }

    <span className="ml1">
      { stepNumber === currentStepNumber && <span>....</span> }
      { stepNumber < currentStepNumber && <span className="green">OK</span> }
    </span>
  </li>
)


module.exports = React.createClass({
  displayName: 'Setup',

  propTypes: {
  },

  getInitialState() {
    return {
      cellGeneExpressionData: null,
      currentStep: 0,
      error: null
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
        this.setState({ error });
      });
  },

  checkIDBCompatibility() {
    new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject('Browser does not support indexedDB standard.')
      } else if (!window.Blob) {
        reject('Browser does not support Blob standard.');
      } else {
        this.setState({ currentStep: 1 }, resolve);
      }
    });
  },

  parseCellGeneMeasures() {
    var db = require('../db')()

    var measures = new Promise((resolve, reject) => {
      db.datasets.get('cellGeneMeasuress', ({ blob }) => {
        var reader = new FileReader();

        reader.onloadend = () => {
          this.setState({
            cellGeneExpressionData: JSON.parse(reader.result),
          })

          resolve();
        }
        reader.onerror = err => reject(err);

        reader.readAsText(blob);
      });
    });

    var alternateNames = getAlternateGeneNamesSeq().then(alternateNamesMap => {
      var alternateGeneNamesSeq = alternateNamesMap.toSeq().cacheResult();

      this.setState({
        alternateGeneNames: alternateNamesMap,
        alternateGeneNamesSeq
      })
    })

    return Promise.all([measures, alternateNames]).then(() => {
      return new Promise(resolve => {
        this.setState({ currentStep: 2 }, resolve)
      })
    })
  },

  render() {
    var Application = require('./application.jsx')

    var {
      currentStep,
      cellGeneExpressionData,
      alternateGeneNames,
      alternateGeneNamesSeq,
    } = this.state

    return (
      <main>
        {
          currentStep < 3 && (
            <div className="m3">
              <h1 className="m0">Initializing application</h1>
              <ol>
                <CurrentStep
                    stepNumber={0}
                    currentStepNumber={currentStep}
                    message="Confirming browser compatibility" />

                <CurrentStep
                    stepNumber={1}
                    currentStepNumber={currentStep}
                    message="Downloading cell-gene-measures" />

                <CurrentStep
                    stepNumber={2}
                    currentStepNumber={currentStep}
                    message="Starting application" />
              </ol>
            </div>
          )
        }

        {
          currentStep === 3 && cellGeneExpressionData && (
            <Application
                cellGeneExpressionData={cellGeneExpressionData}
                alternateGeneNames={alternateGeneNames}
                alternateGeneNamesSeq={alternateGeneNamesSeq}
            />
          )
        }
      </main>
    )
  }
});
