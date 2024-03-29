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

export async function buildTranscriptCorpus(
  transcripts: string[],
  transcriptAliases: Map<string, string[]>
) {
  const corpus: Record<string, string> = {}

  let i = 0

  for (const [ transcript, aliases ] of transcriptAliases) {
    for (const alias of [...aliases, transcript]) {
      // FIXME: This should probably throw if an alias is not unique (i.e. can
      // can identify two different transcripts)
      corpus[alias] = transcript

      i++
      if (i % 5000 === 0) await delay(0)
    }
  }

  transcripts.forEach(transcript => {
    if (!(transcript in corpus)) {
      corpus[transcript] = transcript
    }
  })

  return {
    corpus,
    transcriptAliases,
  }
}

let transcriptLabelErrorRaised = false

const transcriptLookupCache: WeakMap<
  object,
  (transcriptID: string) => string | null
> = new WeakMap()

export const getTranscriptLookup = memoizeForProject<LoadedProject>()(
  transcriptLookupCache,
  project => project.data.transcriptCorpus,
  project => {
    const { transcriptLabelTemplate } = project.config
        , { transcriptCorpus, transcriptAliases } = project.data

    const fn = function getCanonicalTranscriptLabel(transcriptName: string) {
      const canonicalID = transcriptCorpus[transcriptName] || null

      if (canonicalID === null) return null

      if (!transcriptLabelTemplate) return canonicalID

      const aliases = transcriptAliases.get(canonicalID)

      if (aliases === undefined) return null

      const allNames = [canonicalID, ...aliases]

      const regex = /\$\$\d+\$\$/g

      try {
        return transcriptLabelTemplate.replace(regex, match => {
          const idx = parseInt(match.slice(2, -2))
          return allNames[idx]!
        })
      } catch (e) {
        if (!transcriptLabelErrorRaised) {
          console.error('Transcript label template invalid')
          console.error(e)
          transcriptLabelErrorRaised = true
        }
        return canonicalID
      }
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
    const { transcriptCorpus } = project.data

    function searchTranscripts (name: string, limit=20) {
      const results: TranscriptSearchResult[] = []

      for (const x of Object.entries(transcriptCorpus)) {
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
