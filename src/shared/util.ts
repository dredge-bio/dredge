import { LoadedProject, delay } from '@dredge/main'

export function memoizeForProject<P extends LoadedProject>() {
  return function memoized<T, U extends object>(
    cache: WeakMap<U, T>,
    getCacheKey: (project: P) => U,
    makeCache: (project: P) => T
  ) {
    return (project: P) => {
      const cacheKey = getCacheKey(project)
          , cached = cache.get(cacheKey)

      if (cached) return cached

      const fn = makeCache(project)

      cache.set(cacheKey, fn)

      return fn
    }
  }
}

export async function buildTranscriptCorpus(transcripts: string[], transcriptAliases: Record<string, string[]>) {
  const corpus: Record<string, string> = {}
      , corpusVals: ([alias: string, transcript: string])[] = []

  let i = 0
  for (const [ transcript, aliases ] of Object.entries(transcriptAliases)) {
    for (const alias of [...aliases, transcript]) {
      // FIXME: This should probably throw if an alias is not unique (i.e. can
      // can identify two different transcripts)
      corpus[alias] = transcript
      corpusVals.push([alias, transcript])

      i++
      if (i % 5000 === 0) await delay(0)
    }
  }

  i = 0
  transcripts.forEach(transcript => {
    if (!(transcript in corpus)) {
      corpus[transcript] = transcript
      corpusVals.push([transcript, transcript])
    }
  })

  return {
    corpus,
    transcriptAliases: corpusVals,
  }
}

const transcriptLookupCache: WeakMap<
  object,
  (transcriptID: string) => string | null
> = new WeakMap()

export const getTranscriptLookup = memoizeForProject<LoadedProject>()(
  transcriptLookupCache,
  project => project.data.transcriptCorpus,
  project => {
    const { transcriptCorpus } = project.data

    const fn = function getCanonicalTranscriptLabel(transcriptName: string) {
      return transcriptCorpus[transcriptName] || null
    }

    return fn
  }
)

type TranscriptSearchResult = {
  alias: string;
  canonical: string;
}

const searchTranscriptsCache: WeakMap<
  object,
  (transcriptID: string, limit: number) => TranscriptSearchResult[]
> = new WeakMap()

export const getSearchTranscripts = memoizeForProject<LoadedProject>()(
  searchTranscriptsCache,
  project => project.data.transcriptAliases,
  project => {
    const { transcriptAliases } = project.data

    function searchTranscripts (name: string, limit=20) {
      const results: TranscriptSearchResult[] = []

      for (const x of transcriptAliases) {
        if (x[0].startsWith(name)) {
          results.push({
            alias: x[0], canonical: x[1],
          })

          if (results.length === limit) break;
        }
      }

      return results
    }

    return searchTranscripts
  }
)
