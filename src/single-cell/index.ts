
const RECORD_SIZE = 6
    , VERSION_OFFSET = 0x00
    , LOOKUP_TABLE_SIZE_OFFSET = 0x02
    , FLOATS_START = 0x04

export default class SingleCellExpression {
  transcripts: string[];
  cells: string[];
  expressions: DataView;

  offsets: [number, number][];

  transcriptIdxsByLabel: Map<string, number>;

  constructor(
    transcripts: string[],
    cells: string[],
    expressions: DataView
  ) {
    this.transcripts = transcripts;
    this.cells = cells;
    this.expressions = expressions;

    this.offsets = this.buildOffsets()

    this.transcriptIdxsByLabel = new Map(
      transcripts.map((label, i) => [label, i]))
  }

  buildOffsets() {
    const view = this.expressions
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
      : this.transcriptIdxsByLabel.get(transcript)

    if (transcriptIdx === undefined) {
      throw new Error(`Transcript ${transcript} does not exist in expression data`)
    }

    const termini = this.offsets[transcriptIdx]
        , view = this.expressions

    if (!termini) {
      throw new Error(`Transcript index ${transcriptIdx} does not exist in expression data`)
    }

    const [ start, end ] = termini

    const expressions = [] as { cell: string, expression: number }[]

    for (let i = start; i < end; i += RECORD_SIZE) {
      const cellID = view.getUint16(i + 2, true)
          , expressionID = view.getUint16(i + 4, true)
          , expression = view.getFloat32(FLOATS_START + expressionID * 4, true)

      expressions.push({
        cell: this.cells[cellID]!,
        expression,
      })
    }

    return expressions
  }
}
