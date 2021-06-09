export async function delay(time: number) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
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
