"use strict";

var React = require('react')
  , Immutable = require('immutable')
  , { saveAs } = require('filesaver.js')

module.exports = React.createClass({
  displayName: 'Actions',

  propTypes: {
  },

  getInitialState() {
    return {
      addingGenes: false,
      addingGeneText: '',
      alternateGeneNames: null,
      alternateGeneNamesSeq: null
    }
  },

  handleClickAddGene() {
    var getAlternateGeneNamesSeq = require('../../utils/get_alternate_gene_names')
      , { alternateGeneNames } = this.state

    this.setState({ addingGenes: true });

    if (!alternateGeneNames) {
      getAlternateGeneNamesSeq()
        .then(alternateNamesMap => {
          var alternateGeneNamesSeq = alternateNamesMap.toSeq().cacheResult();
          this.setState({
            alternateGeneNames: alternateNamesMap,
            alternateGeneNamesSeq
          });
        });
    }

    setTimeout(() => {
      this.refs.search.focus();
    }, 1);
  },

  handleSelectGene(name) {
    var { setSavedGenes, savedGeneNames } = this.props

    setSavedGenes(savedGeneNames.add(name));

    this.setState({
      addingGenes: false,
      addingGeneText: ''
    });
  },

  handleAddBrushedGenes() {
    var { brushedGenes, savedGeneNames, setSavedGenes } = this.props

    setSavedGenes(savedGeneNames.union(brushedGenes.map(gene => gene.get('geneName'))));
  },

  handleRemoveBrushedGenes() {
    var { brushedGenes, savedGeneNames, setSavedGenes } = this.props

    setSavedGenes(savedGeneNames.subtract(brushedGenes.map(gene => gene.get('geneName'))));
  },

  handleClearSavedGenes() {
    var { setSavedGenes } = this.props

    setSavedGenes(Immutable.OrderedSet());
  },

  handleImport() {
    this.refs.import.dispatchEvent(new MouseEvent('click'));
  },

  handleImportUpload(e) {
    var { setSavedGenes, savedGeneNames } = this.props
      , reader = new FileReader()
      , file = e.target.files[0]

    // TODO: only allow valid names
    reader.onload = ee => {
      var text = ee.target.result
        , names = text.trim().split('\n').map(row => row.split(',')[0])

      this.refs.import.value = '';
      setSavedGenes(savedGeneNames.union(names));
    }

    reader.readAsText(file);
  },

  handleExport() {
    var { savedGenes } = this.props
      , csv = ''
      , blob

    savedGenes.forEach(gene => {

      csv += [
        gene.get('geneName'),
        gene.get('pValue'),
        gene.get('logCPM'),
        gene.get('logFC')
      ].join(',');

      csv += '\n';
    });

    csv = csv.trim();

    blob = new Blob([csv], { type: 'text/csv;charset=iso-8859-1' });
    saveAs(blob, 'exported_genes.csv');
  },

  render() {
    var { brushedGenes, savedGenes } = this.props
      , { alternateGeneNames, alternateGeneNamesSeq, addingGenes, addingGeneText } = this.state
      , btnClassName = "btn btn-outline bg-white btn-small mr2"

    return (
      <div className="px2 py1">
        <h2 className="m0 mb1 h4">Watched genes</h2>
        <div>
          {
            !addingGenes && (
              <div style={{ fontSize: '14px' }}>
                <button
                    className={btnClassName}
                    onClick={this.handleClickAddGene}>
                  Search
                </button>
                <button
                    className={btnClassName}
                    disabled={!brushedGenes.size}
                    onClick={this.handleAddBrushedGenes}>
                  Add selected
                </button>
                <button
                    className={btnClassName}
                    disabled={!brushedGenes.size}
                    onClick={this.handleRemoveBrushedGenes}>
                  Remove selected
                </button>
                <button
                    className={btnClassName}
                    disabled={!savedGenes.size}
                    onClick={this.handleClearSavedGenes}>
                  Remove all
                </button>

                <button
                    className={btnClassName + ' right'}
                    onClick={this.handleImport}>
                  Import
                </button>

                <input
                    type="file"
                    ref="import"
                    accept="text/csv"
                    onChange={this.handleImportUpload}
                    style={{
                      position: 'absolute',
                      top: -1000
                    }} />

                <button
                    className={btnClassName + ' right'}
                    disabled={!savedGenes.size}
                    onClick={this.handleExport}>
                  Export
                </button>
              </div>
            )
          }

          <div className={addingGenes ? '' : "hide"}>
            <input
                ref="search"
                type="text"
                className="field"
                value={addingGeneText}
                onBlur={e => this.setState({ addingGeneText: '', addingGenes: false })}
                onChange={e => this.setState({ addingGeneText: e.target.value })} />
          </div>
        </div>

        {
          addingGenes && addingGeneText && alternateGeneNames && (
            <div className="absolute px2 py1" style={{
              width: 400,
              top: '72px',
              zIndex: 10,
              border: '1px solid #ccc',
              background: '#f0f0f0'
            }}>
              {
                alternateGeneNamesSeq
                  .filter((v, k) => !!k.match(addingGeneText))
                  .take(20)
                  .map((v, k) =>
                    <div key={k}>
                      <a onMouseDown={this.handleSelectGene.bind(null, v)}>
                        { k } { k !== v && `(aka ${v})` }
                      </a>
                    </div>
                  )
                  .toList()
              }
            </div>
          )
        }
      </div>
    )
  }
});
