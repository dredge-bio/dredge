import { createElement as h } from 'react'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import LRU from 'lru-cache'

import { count } from '@dredge/main'

import { useView } from '../../hooks'
import { TranscriptImage } from '../../types'

type TranscriptImageWithElement = TranscriptImage & {
  element: HTMLImageElement;
}

function loadImage(filename: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image()

    image.addEventListener('load', () => { resolve(image) })
    image.addEventListener('error', () => { resolve(null) })

    image.src = filename
  })
}

function getImageCornerColors(element: HTMLImageElement) {
  const canvas = document.createElement('canvas')
      , width = element.naturalWidth
      , height = element.naturalHeight

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  ctx!.drawImage(element, 0, 0)

  const cornerPoints = [
    [10, 10],
    [width - 10, 10],
    [width - 10, height - 10],
    [10, height - 10],
  ] as [ number, number ][]

  return cornerPoints.map(
    ([ x, y ]) => {
      const pixel = ctx!.getImageData(x, y, 1, 1)
          , data = pixel.data

      return `rgb(${data[0]}, ${data[1]}, ${data[2]})`
    })
}

function getTranscriptBG(elements: HTMLImageElement[]) {
  if (elements.length === 0) return null

  const cornerColors = elements.map(getImageCornerColors).flat()
      , colorCounts = count(cornerColors)
      , [ topColor, topColorCount ] = [...colorCounts].sort((a, b) => b[1] - a[1])[0]!

  // Return a color if at least half of the matched colors are the same
  return topColorCount >= (elements.length * 2)
    ? topColor
    : null
}

function gridColumns(imageCount: number) {
  if (imageCount < 2) return '1fr'
  if (imageCount == 2) return 'repeat(2, 1fr)'
  return `repeat(${Math.ceil(imageCount / 2)}, 1fr)`
}

const ImageContainer = styled.div<{
  imageCount: number;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;

  padding: 8px;
  grid-gap: 4px;

  grid-template-columns: ${ props => gridColumns(props.imageCount) };

  img {
    margin: auto;
    min-width: 0;
    min-height: 0;
    max-width: 100%;
    max-height: 100%;
  }
`

export default function TranscriptImages() {
  const { hoveredTranscript, focusedTranscript, project } = useView()
      , { transcriptImages } = project.data
      , showTranscript = hoveredTranscript || focusedTranscript
      , [ loading, setLoading ] = useState(false)
      , imgContainerRef = useRef<HTMLDivElement | null>(null)
      , [ bgColor, setBGColor ] = useState<string | null>(null)

  const imageCache = useRef(new LRU<string, HTMLImageElement>(20))

  const currentImages = useRef({
    images: null as TranscriptImage[] | null,
    loaded: false,
  })

  const images = showTranscript && transcriptImages.get(showTranscript) || null

  currentImages.current.images = images

  useEffect(() => {
    const { images } = currentImages.current

    currentImages.current.loaded = false

    if (images === null) {
      setLoading(false)
      setBGColor(null)
      return
    }

    const showLoading = (
      (images === currentImages.current.images) &&
      !currentImages.current.loaded
    )

    if (showLoading) {
      setLoading(true)
      setBGColor(null)
    }

    const loadImages = async () => {
      imgContainerRef.current!.innerHTML = ''

      const loadedImages = await Promise.all(
        images.map(async image => {
          let element: HTMLImageElement | null

          const cached = imageCache.current.get(image.filename)

          if (!cached) {
            element = await loadImage(image.filename)

            if (element) {
              imageCache.current.set(image.filename, element)
            }
          } else {
            element = cached
          }

          return { image, element }
        })
      )

      currentImages.current.loaded = true

      const failures: TranscriptImage[] = []
          , successes: TranscriptImageWithElement[] = []

      setLoading(false)

      loadedImages.forEach(({ image, element }) => {
        if (element === null) {
          failures.push(image)
        } else {
          successes.push({ ...image, element })
        }
      })

      // Bail out if a new set of images is being rendered
      const container = imgContainerRef.current

      if (container == undefined) return;
      if (images !== currentImages.current.images) return;

      const bgColor = getTranscriptBG(successes.map(x => x.element))

      setBGColor(bgColor)

      successes.forEach(({ element }) => {
        container.appendChild(element)
      })

    }


    loadImages()

  }, [ images ])

  return (
    h('div', {
      style: {
        position: 'relative',
        background: bgColor || '#bbb',
        height: '100%',
      },
    }, ...[
      h(ImageContainer, {
        key: showTranscript,
        ref: imgContainerRef,
        imageCount: images ? images.length : 0,
      }),

      !loading ? null : h('div', {
        style: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }, ...[
        h('span', {
          style: {
            padding: '16px 32px',
            backgroundColor: 'white',
            border: '2px solid #ccc',
            fontWeight: 'bold',
          },
        }, ...[
          'loading',
        ]),
      ]),

    ])
  )
}
