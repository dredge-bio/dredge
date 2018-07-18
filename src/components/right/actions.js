"use strict"

const h = require('react-hyperscript')
    , React = require('react')
    , Immutable = require('immutable')
    , { saveAs } = require('filesaver.js')

module.exports = React.createClass({
  displayName: 'Actions',

  propTypes: {},

  getInitialState() {
    return {
      addingGenes: false,
      addingGeneText: '',
    }
  },

  handleClickAddGene() {
    this.setState({ addingGenes: true })

    setTimeout(() => {
      this.refs.search.focus()
    }, 1)
  },

  handleSelectGene(name) {
    const { setSavedGenes, savedGeneNames } = this.props

    setSavedGenes(savedGeneNames.add(name))

    this.setState({
      addingGenes: false,
      addingGeneText: '',
    })
  },

  handleAddBrushedGenes() {
    const { brushedGenes, savedGeneNames, setSavedGenes } = this.props

    setSavedGenes(savedGeneNames.union(brushedGenes.map(gene => gene.get('geneName'))))
  },

  handleRemoveBrushedGenes() {
    const { brushedGenes, savedGeneNames, setSavedGenes } = this.props

    setSavedGenes(savedGeneNames.subtract(brushedGenes.map(gene => gene.get('geneName'))))
  },

  handleClearSavedGenes() {
    const { setSavedGenes } = this.props

    setSavedGenes(Immutable.OrderedSet())
  },

  handleImport() {
    this.refs.import.dispatchEvent(new MouseEvent('click'))
  },

  handleImportUpload(e) {
    const {
      setSavedGenes,
      savedGeneNames,
      alternateGeneNames,
      alternateGeneNamesSeq,
    } = this.props

    const importInput = this.refs.import,
        reader = new FileReader(),
        file = e.target.files[0]

    // TODO: only allow valid names
    reader.onload = ee => {
      const text = ee.target.result,
          importedGenes = [],
          missingGenes = []

      text.replace(/(\r\n|\n|\r)/gm, '\n').trim().split('\n').forEach(geneName => {
        geneName = geneName.split(',')[0]

        if (alternateGeneNames.has(geneName)) {
          importedGenes.push(geneName)
        } else {
          missingGenes.push(geneName)
        }
      })

      this.setState({
        importedGenes,
        missingGenes,
      })

      importInput.value = ''
      setSavedGenes(savedGeneNames.union(importedGenes.map(geneName => alternateGeneNames.get(geneName))))
    }

    reader.readAsText(file)
  },

  handleExport() {
    const { savedGenes } = this.props

    let csv = ''

    savedGenes.forEach(gene => {
      csv += [gene.get('geneName'), gene.get('pValue'), gene.get('logCPM'), gene.get('logFC')].join(',')
      csv += '\n'
    })

    csv = csv.trim()

    const blob = new Blob([csv], { type: 'text/csv;charset=iso-8859-1' })
    saveAs(blob, 'exported_genes.csv')
  },

  render() {
    const { brushedGenes, savedGenes, alternateGeneNames, alternateGeneNamesSeq } = this.props,
        { addingGenes, addingGeneText } = this.state,
        btnClassName = "btn btn-outline bg-white btn-small mr2"

    if (this.state.importedGenes || this.state.missingGenes) {
      return h(
        'div',
        {
          className: 'flex flex-column absolute p2 bg-white',
          style: {
            top: 0, bottom: 0, left: 0, right: 0,
            zIndex: 1,
            border: '10px solid darkmagenta',
          },
        },
        h(
          'h1',
          null,
          'Results of import'
        ),
        h(
          'div',
          null,
          'Succesfully imported genes: ',
          this.state.importedGenes.length
        ),
        this.state.importedGenes.length > 0 && h(
          'pre',
          { style: {
              flexGrow: 1,
              height: 100,
              marginTop: '.5em',
              padding: '.5em',
              overflowX: 'auto',
              backgroundColor: '#eee',
              border: '1px solid #ccc',
            } },
          this.state.importedGenes.map(geneName => {
            const alternateName = alternateGeneNames.get(geneName)

            return alternateName === geneName ? geneName : geneName + ' (imported as ' + alternateName + ')'
          }).join('\n')
        ),
        h(
          'div',
          null,
          'Genes not imported: ',
          this.state.missingGenes.length
        ),
        this.state.missingGenes.length > 0 && h(
          'div',
          null,
          'The following genes were not imported because this dataset contains no information about them.'
        ),
        this.state.missingGenes.length > 0 && h(
          'pre',
          { style: {
              flexGrow: 1,
              height: 100,
              marginTop: '.5em',
              padding: '.5em',
              overflowX: 'auto',
              backgroundColor: '#eee',
              border: '1px solid #ccc',
            } },
          this.state.missingGenes.join('\n')
        ),
        h(
          'div',
          null,
          h(
            'button',
            {
              className: btnClassName,
              onClick: () => {
                this.setState({
                  importedGenes: null,
                  missingGenes: null,
                })
              },
            },
            'OK'
          )
        )
      )
    }

    return h(
      'div',
      { className: 'px2 py1' },
      h(
        'h2',
        { className: 'm0 mb1 h4' },
        'Watched genes'
      ),
      h(
        'div',
        null,
        !addingGenes && h(
          'div',
          { style: { fontSize: '14px' } },
          h(
            'button',
            {
              className: btnClassName,
              onClick: this.handleClickAddGene },
            'Search'
          ),
          h(
            'button',
            {
              className: btnClassName,
              disabled: !brushedGenes.size,
              onClick: this.handleAddBrushedGenes },
            'Add selected'
          ),
          h(
            'button',
            {
              className: btnClassName,
              disabled: !brushedGenes.size,
              onClick: this.handleRemoveBrushedGenes },
            'Remove selected'
          ),
          h(
            'button',
            {
              className: btnClassName,
              disabled: !savedGenes.size,
              onClick: this.handleClearSavedGenes },
            'Remove all'
          ),
          h(
            'button',
            {
              className: btnClassName + ' right',
              onClick: this.handleImport },
            'Import'
          ),
          h('input', {
            type: 'file',
            ref: 'import',
            accept: 'text/csv',
            onChange: this.handleImportUpload,
            style: {
              position: 'absolute',
              top: -1000,
            } }),
          h(
            'button',
            {
              className: btnClassName + ' right',
              disabled: !savedGenes.size,
              onClick: this.handleExport },
            'Export'
          )
        ),
        h(
          'div',
          { className: addingGenes ? '' : "hide" },
          h('input', {
            ref: 'search',
            type: 'text',
            className: 'field',
            value: addingGeneText,
            onBlur: e => this.setState({ addingGeneText: '', addingGenes: false }),
            onChange: e => this.setState({ addingGeneText: e.target.value }) })
        )
      ),
      addingGenes && addingGeneText && alternateGeneNames && h(
        'div',
        { className: 'absolute px2 py1', style: {
            width: 400,
            top: '72px',
            zIndex: 10,
            border: '1px solid #ccc',
            background: '#f0f0f0',
          } },
        alternateGeneNamesSeq.filter((v, k) => !!k.match(addingGeneText)).take(20).map((v, k) => h(
          'div',
          { key: k },
          h(
            'a',
            { onMouseDown: this.handleSelectGene.bind(null, v) },
            k,
            ' ',
            k !== v && `(aka ${v})`
          )
        )).toList()
      )
    )
  },
})
