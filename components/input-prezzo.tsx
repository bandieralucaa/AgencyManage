'use client'

import { useState, useEffect } from 'react'

export default function InputPrezzo({
  name,
  value,
  onChange,
  className,
  placeholder,
}: {
  name: string
  value: string | number
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}) {
  function format(num: string | number): string {
    if (num === '' || num === null || num === undefined) return ''
    const cleaned = String(num).replace(/\./g, '')
    const n = parseFloat(cleaned)
    if (isNaN(n)) return ''
    return n.toLocaleString('it-IT')
  }

  const [display, setDisplay] = useState(() => format(value))

  useEffect(() => {
    setDisplay(format(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    if (raw === '') {
      setDisplay('')
      onChange('')
      return
    }
    const n = parseInt(raw, 10)
    setDisplay(n.toLocaleString('it-IT'))
    onChange(String(n))
  }

  // Il valore raw è quello che verrà inviato con il form
  const rawValue = value === '' || value === null || value === undefined ? '' : String(value)

  return (
    <>
      {/* Input hidden con name → questo è quello che viene inviato al server */}
      <input type="hidden" name={name} value={rawValue} />
      {/* Input visibile → mostra il valore formattato con i punti */}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    </>
  )
}