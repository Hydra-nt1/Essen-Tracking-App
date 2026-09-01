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

interface FocusCapableCapabilities extends MediaTrackCapabilities {
  focusMode?: string[]
}

interface BarcodeScannerProps {
  onDetected: (code: string) => void
}

export function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected
  const [error, setError] = useState<string | null>(null)
  const [autofocusSupported, setAutofocusSupported] = useState<boolean | null>(null)

  useEffect(() => {
    let stopped = false
    let stream: MediaStream | undefined
    let controls: IScannerControls | undefined

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
      } catch {
        if (!stopped) {
          setError('Kamera konnte nicht gestartet werden. Bitte Zugriff in den Browser-Einstellungen erlauben.')
        }
        return
      }

      if (stopped) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const [track] = stream.getVideoTracks()
      try {
        const capabilities = track.getCapabilities() as FocusCapableCapabilities
        const supportsContinuous = !!capabilities.focusMode?.includes('continuous')
        setAutofocusSupported(supportsContinuous)
        if (supportsContinuous) {
          await track.applyConstraints({
            // @ts-expect-error focusMode isn't in the standard MediaTrackConstraints TS typing yet
            advanced: [{ focusMode: 'continuous' }],
          })
        }
      } catch {
        setAutofocusSupported(false)
      }

      if (stopped || !videoRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const reader = new BrowserMultiFormatReader(hints)
      try {
        controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
          if (result && !stopped) {
            stopped = true
            controls?.stop()
            onDetectedRef.current(result.getText())
          }
        })
      } catch {
        if (!stopped) setError('Scanner konnte nicht gestartet werden.')
      }
    }

    start()

    return () => {
      stopped = true
      controls?.stop()
      stream?.getTracks().forEach((t) => t.stop())
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
            Barcode mittig im Rahmen halten, scharf und gut ausgeleuchtet.
            {autofocusSupported === false &&
              ' Dieses Gerät fokussiert nicht automatisch nah — Handy langsam näher/weiter bewegen, bis das Bild scharf wird.'}
          </p>
        </>
      )}
    </div>
  )
}
