import h from 'react-hyperscript'
import { useEffect, useRef, useState } from 'react'

import { useView } from '../hooks'
import { TranscriptImage } from '../types'

function loadImage(filename: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image()

    image.addEventListener('load', () => { resolve(image) })
    image.addEventListener('error', () => { resolve(null) })

    image.src = filename
  })
}

export default function TranscriptInfo() {
  const { hoveredTranscript, focusedTranscript, project } = useView()
      , { transcriptImages } = project.data
      , showTranscript = hoveredTranscript || focusedTranscript
      , [ loading, setLoading ] = useState(false)
      , imgContainerRef = useRef<HTMLDivElement>()

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
      return
    }

    setTimeout(() => {
      const showLoading = (
        (images === currentImages.current.images) &&
        !currentImages.current.loaded
      )

      if (showLoading) {
        setLoading(true)
      }
    }, 10)

    const loadImages = async () => {
      imgContainerRef.current!.innerHTML = ''

      const loadedImages = await Promise.all(
        images.map(image =>
          loadImage(image.filename)
            .then(element => ({ image, element }))))

      currentImages.current.loaded = true

      const failures: TranscriptImage[] = []

      setLoading(false)

      loadedImages.forEach(({ image, element }) => {
        if (element === null) {
          failures.push(image)
        } else {
          if (images === currentImages.current.images && imgContainerRef.current) {
            imgContainerRef.current.appendChild(element)
          }

        }
      })
    }

    loadImages()

  }, [ images ])

  return (
    h('div', {
      style: {
        position: 'relative',
        background: '#999',
        height: '100%',
      },
    }, [
      h('div', {
        key: showTranscript,
        ref: imgContainerRef,
        style: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: '#999',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }, [
      ]),

      !loading ? null : h('div', {
        style: {
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          textAlign: 'center',
        },
      }, [
        'loading',
      ]),

    ])
  )
}
