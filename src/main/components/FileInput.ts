import { createElement as h } from 'react'
import { Button, ButtonProps } from 'rebass'

type FileInputProps = Omit<ButtonProps, 'onChange'> & {
  onChange: (files: FileList | null) => void
}

export function FileInput(props: FileInputProps) {
  const { onChange, ...rest } = props

  function handleClick() {
    const inputEl = document.createElement('input')

    inputEl.type = 'file'
    inputEl.onchange = (e: Event) => {
      const el = e.target as HTMLInputElement
      onChange(el.files)
    }
    inputEl. click()
  }

  return (
    h(Button, {
      ...rest,
      onClick: () => {
        handleClick()
      },
    })
  )
}
