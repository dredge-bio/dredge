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
