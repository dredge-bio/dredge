import { SingleCellProjectData, SeuratCell } from '../types'

const RECORD_SIZE = 6
    , VERSION_OFFSET = 0x00
    , LOOKUP_TABLE_SIZE_OFFSET = 0x02
    , FLOATS_START = 0x04

export default class SingleCellExpression {
  projectData: SingleCellProjectData;

  _offsets: [number, number][];
  _transcriptIdxsByLabel: Map<string, number>;
  _cellsArr: SeuratCell[];

  constructor(
    projectData: SingleCellProjectData,
  ) {
    this.projectData = projectData;
    this._offsets = this.buildOffsets()
    this._transcriptIdxsByLabel = new Map(
      projectData.transcripts.map((label, i) => [label, i]))
    this._cellsArr = [...this.projectData.cells.values()]
  }

  buildOffsets() {
    const view = this.projectData.expressionData
        , offsetStarts = [] as number[]
        , offsets = [] as [number, number][]

    const version = view.getUint16(VERSION_OFFSET, true)

    if (version !== 2) {
      throw Error('Invalid version number')
    }

    const floatLookupSize = view.getUint16(LOOKUP_TABLE_SIZE_OFFSET, true)

    const expressionRecordsStart = FLOATS_START + (4 * floatLookupSize)

    let prevTranscriptID: number | null = null

    for (let i = expressionRecordsStart; i < view.byteLength; i += RECORD_SIZE) {
      const transcriptID = view.getUint16(i, true)

      if (offsetStarts[transcriptID] == null) {
        offsetStarts[transcriptID] = i
        if (prevTranscriptID !== null) {
          offsets[prevTranscriptID] = [
            offsetStarts[prevTranscriptID]!,
            i,
          ]
        }

        prevTranscriptID = transcriptID
      }
    }

    const lastTranscript = offsetStarts.length - 1

    offsets[lastTranscript] = [
      offsetStarts[lastTranscript]!,
      view.byteLength,
    ]

    return offsets
  }

  getExpressionsForTranscript(transcript: number | string) {
    const transcriptIdx = typeof transcript === 'number'
      ? transcript
      : this._transcriptIdxsByLabel.get(transcript)

    if (transcriptIdx === undefined) {
      throw new Error(`Transcript ${transcript} does not exist in expression data`)
    }

    const termini = this._offsets[transcriptIdx]
        , view = this.projectData.expressionData

    if (!termini) {
      throw new Error(`Transcript index ${transcriptIdx} does not exist in expression data`)
    }

    const [ start, end ] = termini

    const expressions = new Map() as Map<SeuratCell, number>

    for (let i = start; i < end; i += RECORD_SIZE) {
      const cellIdx = view.getUint16(i + 2, true)
          , expressionIdx = view.getUint16(i + 4, true)
          , expression = view.getFloat32(FLOATS_START + expressionIdx * 4, true)

      expressions.set(this._cellsArr[cellIdx]!, expression)
    }

    return expressions
  }
}
