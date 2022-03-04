import { createElement as h } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useView } from '../../hooks'
import LRU from 'lru-cache'
import { TranscriptImage } from '../../types'

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
  grid-gap: 8px;

  grid-template-columns: ${ props => gridColumns(props.imageCount) };

  img {
    margin: auto;
    border: 4px solid cornflowerblue;
    min-width: 0;
    min-height: 0;
    max-width: 100%;
    max-height: 100%;
  }
`

function useImageCache() {
  const cacheRef = useRef(new LRU<string, string>({
    max: 50,
    dispose(k, v) {
      URL.revokeObjectURL(v)
    },
  }))

  useEffect(() => {
    return () => {
      cacheRef.current.reset()
    }
  }, [])

  async function getImage(url: string): Promise<HTMLImageElement> {

    if (!cacheRef.current.has(url)) {
      const resp = await fetch(url)

      if (!resp.ok) throw new Error(`${resp.status}: ${resp.statusText}`)

      const blob = await resp.blob()
          , objectURL = URL.createObjectURL(blob)

      cacheRef.current.set(url, objectURL)
    }

    const objectURL = cacheRef.current.get(url)!

    return new Promise(resolve => {
      const img = document.createElement('img')
      img.src = objectURL
      img.onload = () => {
        resolve(img)
      }
    })
  }

  return getImage
}

function imageTitle(image: TranscriptImage) {
  let title = image.resolution

  if (image.title) {
    title += ` – ${image.title}`
  }

  return title
}

type ImageWithElement = {
  image: TranscriptImage,
  el: HTMLImageElement,
}

const ExpandedImageContainer = styled.div`
.background {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 6px;
}

.background {
  background-color: rgba(0, 0, 0, .66);
}

.image {
  position: absolute;
  top: 0;
  left: 0;
}
`

function ExpandedImage(props: ImageWithElement & {
  onClose: () => void;
}) {
  const { image, el, onClose } = props
      , imageContainerRef = useRef<HTMLDivElement>()

  useLayoutEffect(() => {
    imageContainerRef.current!.appendChild(el)
  }, [])

  const children = h(ExpandedImageContainer, null, ...[
    h('div', {
      className: 'background',
      onClick: () => onClose(),
    }),

    h('div', {
      className: 'image',
      ref: imageContainerRef,
      onClick: () => onClose(),
    })
  ])

  return createPortal(children, document.body)
}

export default function TranscriptImages() {
  const { hoveredTranscript, focusedTranscript, project } = useView()
      , { transcriptImages } = project.data
      , showTranscript = hoveredTranscript || focusedTranscript
      , imgContainerRef = useRef<HTMLDivElement | null>(null)
      , getImage = useImageCache()

  const [ loadedImages, setLoadedImages ] = useState<Map<string, HTMLImageElement>>(new Map())

  const [ expandedImage, setExpandedImage ] = useState<ImageWithElement | null>(null)

  const images = showTranscript && transcriptImages.get(showTranscript) || null

  useEffect(() => {
    async function refresh() {
      setLoadedImages(new Map())

      if (images) {
        images.forEach(image => {
          getImage(image.filename).then(imageEl => {
            setLoadedImages(prev => new Map([ ...prev, [image.filename, imageEl]]))
          })
        })
      }
    }

    refresh()
  }, [ showTranscript ])

  return (
    h('div', {
      style: {
        position: 'relative',
        background: '#bbb',
        height: '100%',
      },
    }, ...[
      h(ImageContainer, {
        key: showTranscript,
        ref: imgContainerRef,
        imageCount: images ? images.length : 0,
      }, showTranscript && images && images.map(val =>
        h('div', {
          key: val.filename,
          ['data-name']: btoa(val.filename),
          style: {
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }, ...[
          h('div', {
            className: 'image',
            onClick() {
              getImage(val.filename).then(el => {
                setExpandedImage({
                  el,
                  image: val,
                })
              })
            },
            style: {
              overflow: 'hidden',
              display: 'flex',
            },
          }, ...[
            !loadedImages.has(val.filename) ? null : (
              h(() => {
                const container = document.querySelector(`[data-name="${btoa(val.filename)}"] .image`)
                if (container) {
                  container.appendChild(loadedImages.get(val.filename)!)
                }

                return null
              })
            ),
          ]),

          !loadedImages.has(val.filename) ? null : (
            h('div', null, imageTitle(val))
          ),
        ])
      )),

      expandedImage && h(ExpandedImage, {
        ...expandedImage,
        onClose() {
          setExpandedImage(null)
        },
      }),
    ])
  )
}
