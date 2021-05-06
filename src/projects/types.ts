export type Config = {
  label: string;
  readme: string,
  transcriptHyperlink: Array<{
    label: string,
    url: string,
  }>;
}

export type TranscriptData = {
  transcripts: string[];
  transcriptCorpus: Record<string, string>;
  transcriptAliases: ([alias: string, transcript: string])[];
}
