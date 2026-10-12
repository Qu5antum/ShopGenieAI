export type GenerationType =
  | 'text_to_image'
  | 'image_to_image'
  | 'text_to_video'
  | 'image_to_video'

export interface CreateGenerationInput {
  model: string
  type: GenerationType
  prompt: string
  image?: File | string
}

export interface GenerationRecord {
  requestId: string
  model: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  statusUrl: string
  responseUrl: string
  outputs?: unknown
  errorMessage?: string | null
}

async function apiRequest<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      'Could not reach the local AI server. Start the app with npm run dev.',
    )
  }

  if (!response.ok) {
    let message = `Local AI server returned error ${response.status}.`
    try {
      const payload: { message?: unknown } = await response.json()
      if (typeof payload.message === 'string') message = payload.message
    } catch {
      // Keep the HTTP status message if the local server returned non-JSON.
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

function fileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Could not read the image.'))
      }
    })
    reader.addEventListener('error', () =>
      reject(new Error('Could not read the image.')),
    )
    reader.readAsDataURL(file)
  })
}

export async function createGeneration(
  input: CreateGenerationInput,
): Promise<GenerationRecord> {
  const image =
    input.image instanceof File
      ? await fileAsDataUrl(input.image)
      : input.image
  return apiRequest<GenerationRecord>('/api/local/fal/generations', {
    model: input.model,
    type: input.type,
    prompt: input.prompt,
    ...(image ? { image } : {}),
  })
}

export async function getGeneration(
  generation: GenerationRecord,
): Promise<GenerationRecord> {
  return apiRequest<GenerationRecord>(
    '/api/local/fal/generations/poll',
    generation,
  )
}
