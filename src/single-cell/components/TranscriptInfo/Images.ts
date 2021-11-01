import { createElement as h } from 'react'
import { useEffect, useLayoutEffect, useRef, useState, SyntheticEvent } from 'react'
import styled from 'styled-components'
import { useView } from '../../hooks'
import LRU from 'lru-cache'

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

export default function TranscriptImages() {
  const { hoveredTranscript, focusedTranscript, project } = useView()
      , { transcriptImages } = project.data
      , showTranscript = hoveredTranscript || focusedTranscript
      , imgContainerRef = useRef<HTMLDivElement | null>(null)
      , [ loadedImages, setLoadedImages ] = useState<Set<string>>(new Set())
      , imgCache = useRef(new LRU<string, HTMLImageElement>(50))

  const images = showTranscript && transcriptImages.get(showTranscript) || null

  useEffect(() => {
    setLoadedImages(new Set())
  }, [showTranscript])

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
          ['data-name']: val.filename,
          style: {
            overflow: 'hidden',
            display: 'flex',
          },
        }, ...[
          imgCache.current.has(val.filename)
            ? h(() => {
                useLayoutEffect(() => {
                  const containerEl = imgContainerRef.current

                  if (containerEl === null) return

                  const div = containerEl.querySelector(`[data-name="${val.filename}"`)
                      , img = imgCache.current.get(val.filename)!

                  img.style.opacity = '1';

                  div!.appendChild(imgCache.current.get(val.filename)!)
                }, [])

                return null
              })
            : h('img', {
                style: {
                  opacity: loadedImages.has(val.filename) ? 1 : 0,
                },
                onLoad(e: SyntheticEvent) {
                  setLoadedImages(prev => new Set([...prev, val.filename]))
                  imgCache.current.set(val.filename, e.target as HTMLImageElement)
                },
                src: val.filename,
              }),
        ])
      )),
    ])
  )
}
