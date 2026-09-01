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
hints.set(DecodeHintType.TRY_HARDER, true)

const videoConstraints: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    // @ts-expect-error focusMode isn't in the standard MediaTrackConstraints TS typing yet
    advanced: [{ focusMode: 'continuous' }],
  },
}

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
      .decodeFromConstraints(videoConstraints, videoRef.current!, (result) => {
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
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="w-full" muted autoPlay playsInline />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-16 -translate-y-1/2 rounded border-2 border-green-400/80" />
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">
            Barcode mittig im Rahmen halten, scharf und gut ausgeleuchtet, ca. 10–15 cm Abstand.
          </p>
        </>
      )}
    </div>
  )
}
