import { LoadedProject } from '@dredge/common'

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
