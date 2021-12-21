import * as React from 'react'
import { createPortal } from 'react-dom'
import { useState, createElement as h } from 'react'
import styled from 'styled-components'
import { Button } from 'rebass'
import { readFile, FileInput, useAppDispatch, LoadedProject } from '@dredge/main'
import { ImportedTranscript } from '@dredge/shared'
import * as actions from './actions'

type InputResultProps = {
  imported: ImportedTranscript[];
  skipped: string[];
  onDismiss: () => void;
}

const ImportResultContainer = styled.div`
.background, .modal {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 6px;
}

.background {
  background-color: rgba(0, 0, 0, .66);
}

.modal {
  background-color: white;
  margin: 1.5em auto;
  max-width: 600px;

  display: grid;
  grid-template-rows: 64px auto 1fr 1fr 64px;
  overflow: auto;

  .close {
    justify-content: flex-end;
    border-bottom: 1px solid #ccc;
  }

  .dismiss {
    border-top: 1px solid #ccc;
  }

  .close, .dismiss {
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
  }

  > * {
    padding: 0 1em;
  }

  > *:not(:last-child) {
    margin-bottom: .66em;
  }
}
`

function ImportResult(props: InputResultProps) {
  const { imported, skipped, onDismiss } = props

  const children = (
    h(ImportResultContainer, null, ...[
      h('div', { className: 'background' }),

      h('div', { className: 'modal' }, ...[
        h('div', { className: 'close' }, ...[
          h('a', {
            href: '#',
            style: {
              color: 'black',
              textDecoration: 'none',
              padding: '8px',
            },
            onClick(e: React.MouseEvent) {
              e.preventDefault();
              onDismiss();
            },
          }, '✖'),
        ]),

        h('div', null, ...[
          `Imported ${imported.length} out of ${imported.length + skipped.length} in file.`,
        ]),

        h('div', null, ...[
          h('h2', null, 'Imported'),

          imported.length === 0
            ? h('p', null, 'None')
            : h('ul', null, imported.map(([ name, canonicalName ]) =>
                h('li', { key: name }, [
                  name,
                  name === canonicalName
                    ? ''
                    : ` (as ${canonicalName})`,
                ]))),
        ]),

        h('div', null, ...[
          h('h2', null, 'Skipped'),

          skipped.length === 0
            ? h('p', null, 'None')
            : h('ul', null, skipped.map(name =>
                h('li', { key: name }, name))),
        ]),

        h('div', { className: 'dismiss' }, ...[
          h(Button, {
            onClick: () => {
              onDismiss()
            },
          }, 'Dismiss'),
        ]),
      ]),
    ])
  )

  return createPortal(children, document.body)
}

export function useImportTranscripts(
  project: LoadedProject,
  onImport?: (transcripts: ImportedTranscript[]) => void
) {
  const dispatch = useAppDispatch()
      , [ importStatusEl, setImportStatusEl ] = useState<React.ReactElement | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return

    const text = await readFile(files[0]!)

    try {
      const resp = dispatch(actions.importSavedTranscripts({
        project,
        text,
      }))

      const { imported, skipped } = resp.payload

      if (onImport) {
        onImport(imported)
      }

      setImportStatusEl(h(ImportResult, {
        imported,
        skipped,
        onDismiss: () => { setImportStatusEl(null) },
      }))
    } catch (e) {
      alert('Error while importing transcripts. See console for details.')
      console.error(e)
    }
  }

  const importButtonEl = h(FileInput, {
    onChange: handleFiles,
  }, 'Import')

  return [ importStatusEl, importButtonEl ]
}
