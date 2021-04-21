
const RECORD_SIZE = 8

export default class SingleCellExpression {
  transcripts: string[];
  cells: string[];
  expressions: DataView;

  offsets: [number, number][];

  constructor(
    transcripts: string[],
    cells: string[],
    expressions: DataView
  ) {
    this.transcripts = transcripts;
    this.cells = cells;
    this.expressions = expressions;

    this.offsets = this.buildOffsets()
  }

  buildOffsets() {
    const view = this.expressions
        , offsetStarts = [] as number[]
        , offsets = [] as [number, number][]

    let prevTranscriptID: number | null = null

    for (let i = 0; i < view.byteLength; i += RECORD_SIZE) {
      const transcriptID = view.getInt16(i, true) - 1

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

  getExpressionsForTranscript(transcriptIdx: number) {
    const termini = this.offsets[transcriptIdx]
        , view = this.expressions

    if (!termini) {
      throw new Error(`Transcript ${transcriptIdx} does not exist in expression data`)
    }

    const [ start, end ] = termini

    const expressions = [] as [number, number, number][]

    for (let i = start; i < end; i += RECORD_SIZE) {
      const transcriptID = view.getInt16(i, true) - 1
          , cellID = view.getInt16(i + 2, true) - 1
          , expression = view.getFloat32(i + 4, true)

      expressions.push([
        transcriptID,
        cellID,
        expression,
      ])
    }

    return expressions
  }
}
