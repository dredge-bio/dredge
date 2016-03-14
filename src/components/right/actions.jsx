"use strict";

var React = require('react')

module.exports = React.createClass({
  displayName: 'Actions',

  propTypes: {
  },

  getInitialState() {
    return {
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
    }, 10);
  },

  render() {
    var { addingGenes, addingGeneText, editSavedGenes } = this.props
      , { alternateGeneNames, alternateGeneNamesSeq } = this.state
    return (
      <div>
        <div>
          {
            !addingGenes ?
              <div style={{ fontSize: '14px' }}>
                <button className="btn btn-outline bg-white btn-small mr2" onClick={this.handleClickAddGene}>
                  Add watched gene
                </button>
                <button className="btn btn-outline bg-white btn-small mr2">
                  Watch all
                </button>
                <button className="btn btn-outline bg-white btn-small mr2">
                  Clear watched genes
                </button>
              </div>
              : (
                <div>
                  <input
                      ref="search"
                      type="text"
                      className="field"
                      onBlur={() => this.setState({ addingGeneText: '', addingGenes: false })}
                      onChange={e => this.setState({ addingGeneText: e.target.value })} />
                </div>
              )
          }
        </div>

        {
          addingGenes && addingGeneText && alternateGeneNames && (
            <div className="absolute px2 py1" style={{
              width: 400,
              top: '46px',
              border: '1px solid #ccc',
              background: '#f0f0f0'
            }}>
              {
                alternateGeneNamesSeq
                  .filter((v, k) => !!k.match(addingGeneText))
                  .take(20)
                  .map((v, k) =>
                    <div key={k}>
                      <a onMouseDown={editSavedGenes.bind(null, true, v)}>
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
