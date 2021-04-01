import h from 'react-hyperscript'
import * as React from 'react'

import { TreatmentName } from '../types'
import { useViewProject } from '../view'

const { useState, useEffect } = React

type SelectorProps = {
  disabled?: boolean;
  blankLabel?: string;
  selectedTreatment: TreatmentName | null;
  onSelectTreatment: (treatment: TreatmentName) => void;
}

const BLANK_KEY = '___blank'

export default function TreatmentListSelector(props: SelectorProps) {
  const { selectedTreatment, onSelectTreatment, blankLabel, disabled } = props
      , [ selectedTreatmentState, setSelectedTreatmentState ] = useState(selectedTreatment || BLANK_KEY)
      , project = useViewProject()
      , { treatments } = project.data

  useEffect(() => {
    setSelectedTreatmentState(selectedTreatment || BLANK_KEY)
  }, [selectedTreatment])

  let treatmentOptions = [...treatments.entries()]
    .map(([ key, val ]) => ({
      key,
      label: val.label || key,
    }))

  if (!selectedTreatment) {
    treatmentOptions = [{ key: BLANK_KEY, label: blankLabel || '' }, ...treatmentOptions]
  }

  return (
    h('select', {
      value: selectedTreatmentState,
      disabled: !!disabled,
      onChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setSelectedTreatmentState(e.target.value)
        if (e.target.value !== BLANK_KEY) {
          onSelectTreatment(e.target.value)
        }
      },
    }, treatmentOptions.map(treatment =>
      h('option', {
        key: treatment.key,
        value: treatment.key,
      }, treatment.label)
    ))
  )
}
