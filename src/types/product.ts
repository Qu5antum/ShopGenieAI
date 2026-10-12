export type Product = {
  id: number
  name: string
  category: string
  price: number
  rating: string
  image: string
  description: string
  features: string[]
  badge?: string
  tone: 'peach' | 'lilac' | 'blue' | 'green'
  videoUrl?: string
}
