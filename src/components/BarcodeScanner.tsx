import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
])

interface BarcodeScannerProps {
  onDetected: (code: string) => void
}

export function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints)
    let controls: IScannerControls | undefined
    let stopped = false

    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, videoRef.current!, (result) => {
        if (result && !stopped) {
          stopped = true
          controls?.stop()
          onDetectedRef.current(result.getText())
        }
      })
      .then((c) => {
        controls = c
      })
      .catch(() => {
        setError('Kamera konnte nicht gestartet werden. Bitte Zugriff in den Browser-Einstellungen erlauben.')
      })

    return () => {
      stopped = true
      controls?.stop()
    }
  }, [])

  return (
    <div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <video ref={videoRef} className="w-full rounded-lg bg-black" muted autoPlay playsInline />
          <p className="mt-2 text-center text-xs text-gray-500">Barcode vor die Kamera halten...</p>
        </>
      )}
    </div>
  )
}
