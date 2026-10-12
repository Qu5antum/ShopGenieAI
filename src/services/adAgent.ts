import type { Product } from '../types/product'

export interface AdCampaign {
  concept: string
  targetAudience: string
  imagePrompts: [string, string, string]
  videoPrompt: string
  headline: string
  productDescription: string
}

export async function createAdCampaign(
  product: Pick<Product, 'name' | 'description' | 'category' | 'image'>,
  goal: string,
): Promise<AdCampaign> {
  let response: Response
  try {
    response = await fetch('/api/local/manus/concept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, goal }),
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

  return (await response.json()) as AdCampaign
}
