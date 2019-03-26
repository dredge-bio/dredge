"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , { Flex, Box, Card, Button, Heading } = require('rebass')
    , { connect } = require('react-redux')
    , styled = require('styled-components').default
    , { Navigable, Route } = require('org-shell')
    , { saveAs } = require('file-saver')
    , Action = require('../actions')

const Container = styled(Box)`
code {
  font-family: monospace;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: black;
  white-space: nowrap;
  padding: 2px 6px;
}

p {
  line-height: 19px;
  }

`

const Field = styled(Box)`
&[data-required=true] label span::after {
  content: "*";
  font-size: 14px;
  margin-left: 1px;
  margin-top: -1px;
  position: absolute;
  color: red;
}

.help-text {
  color: #666;
  max-width: 640px;
}

.resolved-url-link * {
  font-family: monospace;
  font-size: 12px;
}

.label-text {
  display: inline-block;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 4px;
}

.axis-label-text {
  font-weight: bold;
}

.axis-label-type {
  margin-right: 2px;
}

input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

input[type="text"] {
  width: 384px;
}

.resolved-url {
  font-size: 14px;
}

.resolved-url-label {
  font-weight: bold;
  display: inline-block;
  margin-right: 4px;
}

.relative-url-base {
  color: #333;
}

.resolved-url a {
  color: blue;
  text-decoration: none;
}
`

function resolveURL(base, path) {
  try {
    return new URL(path, base).href
  } catch (e) {
    return null
  }
}

const LimitInputContainer = styled(Box)`
  width: 64px;
  margin-right: 8px;
`

function LimitInput({ value, onChange }) {
  return h(LimitInputContainer, {
    as: 'input',
    type: 'number',
    value,
    onChange,
  })
}

function Paragraph(props) {
  return h(Box, Object.assign({
    as: 'p',
    mb: 2,
  }, props))
}

const projectRoot = process.env.ZIP_FILENAME.replace('.zip', '') + '/my_project'

function Input(props) {
  const { showURL, isRelativeURL } = props

  const innerProps = R.omit([
    'children',
    'help',
    'label',
    'required',
    'showURL',
    'isRelativeURL',
  ], props)

  const replaceRelative = showURL && isRelativeURL && showURL.startsWith(window.location.origin)


  return (
    h(Field, { mb: 4, ['data-required']: !!props.required }, [
      h('label', [
        h('span.label-text', props.label),
        h('br'),
        h('input', Object.assign({
          type: 'text',
          autoCorrect: 'off',
          autoCapitalize: 'off',
          spellCheck: false,
        }, innerProps)),
      ]),

      !props.showURL ? null : (
        h(Box, { className: 'resolved-url', my: 2 }, [
          h('span.resolved-url-label', 'Resolved URL: '),
          h('span.resolved-url-link', [
            !replaceRelative ? null : (
              h('span.relative-url-base', new URL('./', window.location.href).href)
            ),
            h('a', { href: showURL, target: '_blank' }, replaceRelative
              ? showURL.replace(new URL('./', window.location.href).href, '')
              : showURL
            ),
          ]),
        ])
      ),

      !props.help ? null : (
        h(Box, { mt: 1, className: 'help-text' }, typeof props.help === 'string'
          ? h('p', props.help)
          : props.help
        )
      ),
    ])
  )
}

class NewProject extends React.Component {
  constructor() {
    super();

    this.state = {
      baseURL: '',
    }

    this.setField = this.setField.bind(this)
  }

  setField(fieldName, fn=R.identity) {
    const { dispatch } = this.props

    const lens = R.lensPath(['config', fieldName])

    return e => {
      if (fieldName === 'baseURL') {
        this.setState({ baseURL: e.target.value })

        dispatch(Action.UpdateLocalConfig(
          R.set(lens, this.getBaseURL().baseURL)
        ))
      } else {
        dispatch(Action.UpdateLocalConfig(
          R.set(lens, fn(e.target.value))
        ))
      }
    }
  }

  getProjectJSON() {
    return this.props.config
  }

  getBaseURL() {
    let baseURL = this.state.baseURL
      , isRelativeURL

    if (!baseURL.startsWith('http')) {
      isRelativeURL = true
      baseURL = resolveURL(window.location.href, baseURL || './')
    }

    if (!baseURL.endsWith('/')) baseURL += '/'

    const resolve = path => resolveURL(baseURL, path, baseURL)

    return { isRelativeURL, baseURL, resolve }
  }

  render() {
    const { navigateTo, config } = this.props
        , { resolve, isRelativeURL } = this.getBaseURL()

    return (
      h(Container, { p: 3 }, [
        h(Heading, { as: 'h1', fontSize: 5 }, 'New project'),

        h(Box, { my: 3 }, [
          /*
          h(Button, {
            mr: 5,
            onClick: () => {
              this.setState(R.always(R.clone(DEFAULT_SETTINGS)), this.persist)
            },
          }, 'Reset form'),
          */

          h(Button, {
            mr: 5,
            onClick: () => {
              navigateTo(new Route('test'))
            },
          }, 'Test'),


          h(Button, {
            mr: 2,
          }, 'Load'),

          h(Button, {
            mr: 2,
            onClick: () => {
              const blob = new Blob(
                [JSON.stringify(this.getProjectJSON(), true, '  ')],
                { type: 'application/json;charset=utf-8' })

              saveAs(blob, 'project.json')
            },
          }, 'Save'),
        ]),

        h(Flex, [
          h(Box, { flex: 1 }, [
            h(Heading, { as: 'h2', mb: 2 }, 'Configuration'),

            h(Input, {
              label: 'Project name',
              required: true,
              onChange: this.setField('label'),
              value: config.label,
            }),

            h(Input, {
              label: 'Root URL',
              help: h('div', [
                h(Box, { as: 'p', mb: 2 }, 'The URL that will be the basis for all further URLs. If this value is not an absolute URL, it will be resolved relative to the page on which DrEdGE is hosted.'),
                h('p', 'When you save this configuration file, it must be placed in this directory.'),
              ]),
              required: true,
              onChange: this.setField('baseURL'),
              value: this.state.baseURL,
              showURL: resolve(''),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Project documentation',
              help: 'A URL to a Markdown file that contains information about this project.',
              required: false,
              onChange: this.setField('readme'),
              value: config.readme,
            }),


            h(Input, {
              label: 'Treatment information URL',
              help: 'The URL that contains information about individual treatments in the dataset. Generating using R scripts as described in the instructions.',
              required: true,
              onChange: this.setField('treatments'),
              value: config.treatments,
              showURL: config.treatments && resolve(config.treatments),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Pairwise comparison URL template',
              help: h(Box, [
                h(Box, { as: 'p', mb: 2 }, 'A template to generate the URLs to pairwise comparison data. The characters \'%A\' will be replaced with the name of the first treatment, and \'%B\' the second.'),
                h('p', [
                  'For example: If my dataset contained the pairwise comparison for treatments T1 and T2 in the directory ',
                  h('code', 'pairwise_tests/T1-T2.csv'),
                  ' the value in this field would be ',
                  h('code', 'pairwise_tests/%A-%B.csv'),
                ]),
              ]),
              onChange: this.setField('pairwiseName'),
              value: config.pairwiseName,
              showURL: config.pairwiseName && resolve(config.pairwiseName),
              isRelativeURL,
            }),

            h(Field, { mb: 4 }, [
              h('label', [
                h('span.label-text', 'MA plot limits'),
              ]),

              h(Box, [
                h('span.axis-label-text', 'X axis'),
                ' (log₂ Average Transcript Abundance)',
                h(Flex, { alignItems: 'center', mt: 1, mb: 2 }, [
                  h('span.axis-label-type', 'min'),
                  h(LimitInput, {
                    value: config.abundanceLimits[0][0],
                    onChange: this.setField(['abundanceLimits', 0, 0], parseFloat),
                  }),

                  h('span.axis-label-type', 'max'),
                  h(LimitInput, {
                    value: config.abundanceLimits[0][1],
                    onChange: this.setField(['abundanceLimits', 0, 1], parseFloat),
                  }),
                ]),
              ]),

              h(Box, [
                h('span.axis-label-text', 'Y axis'),
                ' (log₂ Fold Change)',
                h(Flex, { alignItems: 'center', mt: 1, mb: 2 }, [
                  h('span.axis-label-type', 'min'),
                  h(LimitInput, {
                    value: config.abundanceLimits[1][0],
                    onChange: this.setField(['abundanceLimits', 1, 0], parseFloat),
                  }),

                  h('span.axis-label-type', 'max'),
                  h(LimitInput, {
                    value: config.abundanceLimits[1][1],
                    onChange: this.setField(['abundanceLimits', 1, 1], parseFloat),
                  }),
                ]),
              ]),

              h(Box, { mt: 1, className: 'help-text' }, [
                h('p', 'The limits for the X and Y axes on the MA Plot. Set these to values such that all of the data from your pairwise comparisons will fall within the plot.'),
              ]),
            ]),

            h(Input, {
              label: 'Transcript aliases URL',
              help: h(Paragraph, [
                'The URL that contains information about alternate names for transcripts in the dataset. This should be a CSV file whose first column contains the canonical label for a transcript, and whose other columns contain alternate names. One of these columns must contain a value found in the ',
                h('code', 'treatment.id'),
                ' column in the ',
                h('strong', 'project design file'),
                ' described in the instructions.',
              ]),
              onChange: this.setField('transcriptAliases'),
              value: config.transcriptAliases,
              showURL: config.transcriptAliases && resolve(config.transcriptAliases),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Gene expression matrix URL',
              help: h(Paragraph, [
                'The URL of the file containing abundance measures for each transcript by treatement. This is the same file described in the instructions.',
              ]),
              onChange: this.setField('abundanceMeasures'),
              value: config.abundanceMeasures,
              showURL: config.abundanceMeasures && resolve(config.abundanceMeasures),
              isRelativeURL,
            }),

            h(Input, {
              label: 'Diagram URL',
              help: 'The URL of the SVG diagram for this project',
              onChange: this.setField('diagram'),
              value: config.diagram,
              showURL: config.diagram && resolve(config.diagram),
              isRelativeURL,
            }),
          ]),

          h(Card, { flex: 1, ml: 4, pl: 4, borderLeft: 1, borderColor: '#ccc' }, [
            h(Heading, { as: 'h2', mb: 2 }, 'Instructions'),

            h(Paragraph, [
              `
              To add a new project based on your own dataset, first download a local copy of DrEdGE so that you can work will files on your own machine. This zip file contains all of the static files and R scripts needed to generate and serve files based on transcript measurements:
              `,
              h('a', {
                href: process.env.ZIP_FILENAME,
              }, process.env.ZIP_FILENAME),
            ]),

            h(Heading, { as: 'h3', mb: 2, fontSize: 3 }, 'Setting up DrEdGE'),

            h(Paragraph, [
              `
              You will need to serve this page via a local Web server on your own machine. If you have Python installed, this can be done by changing to the directory containing the file
              `,
              h('code', 'index.html'),
              `
              and running
              `,
              h('code', 'python3 -m http.server'),

              ' (Python 3) or ',

              h('code', 'python -m SimpleHTTPServer'),

              ' (Python 2). These commands will serve DrEdGE on your own machine on port 8000. Add a number at the end of the command to change the default port number. Once you have your local application up and running, visit this page there. If you used the default port, this should be located at ',

              h('a', {
                href: `http://localhost:8000/${window.location.search}`,
              }, `http://localhost:8000/${window.location.search}`),

              ' or ',

              h('a', {
                href: `http://127.0.0.1:8000/${window.location.search}`,
              }, `http://127.0.0.1:8000/${window.location.search}`),
            ]),

            h(Paragraph, [
              'Next, make a folder somewhere within your local dredge installation where you will keep project data. For this example, we\'ll assume it\'s called ',
              h('code', 'my_project'),
              ', and that it is located in the folder ',
              h('code', projectRoot),
              '. Because we will put all of our project files in this directory, enter the value ',
              h('code', 'my_project'),
              ' in the ',
              h('strong', 'Root URL'),
              ' field to the left.',
            ]),

            h(Heading, { as: 'h3', mb: 2, fontSize: 3 }, 'Preparing project dataset'),

            h(Paragraph, [
              `
              Next, you will need to have ready two different files: a project design file, which describes characteristics about the treatments and replicates in the dataset, and a gene expression matrix, which gives measurements of transcript abundance by each replicate.
              `,
            ]),

            h(Paragraph, [
              'The ',
              h('strong', 'project design file'),
              `
              is a tab-separated table with a header row and multiple rows representing each of the replicates in the dataset. The following columns must be present, and they must be labeled exactly as given below:
              `,
            ]),

            h(Box, { as: 'ul', mb: 2 }, [
              h(Box, { as: 'li', mb: 2 }, [
                h('code', 'replicate.id'),
                ': A unique identifier for a replicate.',
              ]),

              h(Box, { as: 'li', mb: 2 }, [
                h('code', 'treatment.id'),
                ': An identifier for the treatment that this replicate belongs to. (This will be used to combine different replicates in the same treatment)',
              ]),

              h(Box, { as: 'li', mb: 2 }, [
                h('code', 'treatment.name'),
                ': The label that will be used to render a human-readable name for the given treatment.',
              ]),
            ]),

            h(Paragraph, [
              'The ',
              h('strong', 'gene expression matrix'),
              `
              should be a tab-separated table with rows representing the abundance of a transcript in each replicate in the dataset. The header row should contain columns for every replicate in the dataset, and the first column should be a list of every transcript in the dataset. The top-leftmost cell of the table should be empty. This will look like:
              `,
            ]),

            h(Paragraph, { as: 'pre' }, [
`      r1      r2      r3        r4
t1    32.2    24.3    6742.3    0.04
t2    43.1    44.1    5423.1    9.1
t3    19.1    100.2   661.9     5.4
t4    154.1   0.4     555.1     6.2`,
            ]),
            h(Paragraph, [
              'Where the abundance of t1 in r1 is 32.2, the abundance of t1 in r2 is 24.3, and so on.',
            ]),

            h(Paragraph, [
              'Copy this file to the ',
              h('code', projectRoot),
              ' directory, and record it in the ',
              h('strong', 'Gene Expression Matrix URL'),
              ' field to the left. For this example, we will assume this file is called ',
              h('code', projectRoot + '/expression_matrix.tsv'),
            ]),

            h(Heading, { as: 'h3', mb: 2, fontSize: 3 }, 'Generating DrEdGE data'),

            h(Paragraph, [
              'Once these files are ready, you will be able to generate the files for ',
              h('strong', 'treatment information'),
              ' and ',
              h('strong', 'pairwise comparisons'),
              ', as well as the appropriate ',
              h('strong', 'MA Plot limits'),
              ' for your project.',
            ]),

            h(Paragraph, [
              `First, open a terminal and change directories to ${projectRoot}. Next, download the R script `,
              h('a', {
                href: 'r-scripts/JSON_treatments.R',
              }, 'JSON_treatments.R'),
              '. Then run the script using the command:',
            ]),

            h(Paragraph, { as: 'pre', ml: 3 }, [
              `Rscript JSON_treatments.R -i expression_matrix.tsv`,
            ]),

            h(Paragraph, [
              'This will generate the file ',
              h('code', `${projectRoot}/treatments.json`),
              '. Record the value ',
              h('code', 'treatments.json'),
              ' on the left in the field for ',
              h('strong', 'Treatment information URL'),
              '. (You can change the output of the JSON file using the ',
              h('code', '-i'),
              'flag in the script)',
            ]),

            h(Paragraph, [
              'Run the pairwise comparison generation script in much the same way, using the R script ',
              h('a', {
                href: 'r-scripts/pairwise_comparisons.R',
              }, 'pairwise_comparisons.R'),
            ]),

            h(Heading, { as: 'h3', mb: 2, fontSize: 3 }, 'Saving configuration'),
            h(Paragraph, [
              'Once you have filled out the configuration on the left, press the "Test" button to see if your configuration loads appropriately. If you are satisfied, press the "Save" button, and save the file inside the ',
              h('code', projectRoot),
              ' folder. By default, the file is called "project.json"',
            ]),

            h(Paragraph, [
              'Create a file called "projects.json" inside the base dredge folder: ',
              h('code', projectRoot + '/projects.json'),
              '. This will give DrEdGE information about all the projects to load. It should contain a JSON object whose keys are short labels for the project to load, and whose values are paths to the projects\' configuration files. In our case, this file should contain:',
            ]),

            h(Paragraph, { as: 'pre' }, [
`{
  "my_project": "my_project/project.json"
}`,
            ]),

            h(Paragraph, [
              'Restart DrEdGE, and hopefully your project will be available.',
            ]),
          ]),
        ]),
      ])
    )
  }
}

module.exports = R.pipe(
  Navigable,
  connect(state => ({
    config: state.projects.local.config,
    baseURL: state.projects.local.baseURL,
  }))
)(NewProject)
