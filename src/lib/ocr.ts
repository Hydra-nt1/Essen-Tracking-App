export async function recognizeText(image: File): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('deu')
  try {
    const { data } = await worker.recognize(image)
    return data.text
  } finally {
    await worker.terminate()
  }
}
