export async function delay(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

export function count<T>(items: T[]) {
  const counts: Map<T, number> = new Map()

  items.forEach(item => {
    const prevCount = counts.get(item) || 0
    counts.set(item, prevCount + 1)
  })

  return counts
}

type Point = [x: number, y: number]

export function distance(p1: Point, p2: Point) {
  return Math.hypot(p2[0] - p1[0], p2[1] - p1[1])
}

export function shallowEquals(a: unknown, b: unknown) {
  if (typeof a === 'object' && typeof b === 'object') {
    if (a === null) return a === b
    if (b === null) return b === a

    const keys = [...Object.keys(a), ...Object.keys(b)]

    const aa = a as Record<string, unknown>
        , bb = b as Record<string, unknown>

    for (const key of keys) {
      if (aa[key] !== bb[key]) {
        return false
      }
    }

    return true
  }

  return a === b
}

export function findParent(selector: string, el: HTMLElement) {
  return el.closest(selector)
}

export function formatNumber(number: number | null, places=2) {
  if (number === null) {
    return '--'
  } else if (number === 0) {
    return '0'
  } else if (Math.abs(number) < Math.pow(10, -places)) {
    return number.toExponential(places - 2)
  } else if ((number.toString().split('.')[1] || '').length <= places) {
    return number.toString()
  } else {
    return number.toFixed(places)
  }
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = e => {
      if (e.target === null) {
        reject()
        return;
      }

      resolve(e.target.result as string)
    }

    reader.onerror = e => {
      reject(e)
    }

    reader.readAsText(file)
  })
}

export async function fetchResource(url: string, cache=true) {
  const headers = new Headers()

  if (!cache) {
    headers.append('Cache-Control', 'no-cache')
  }

  const resp = await fetch(url, { headers })

  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error('File not found')
    }

    throw new Error(`Error requesting file (${resp.statusText || resp.status })`)
  }

  return resp
}

export async function buildIndexMap(items: string[], pauseEvery=100) {
  const indices: Record<string, number> = {}

  let idx = 0

  for (const item of items) {
    indices[item] = idx;
    idx++;
    if (idx % pauseEvery === 0) await delay(0)
  }

  return indices
}
