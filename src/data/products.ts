import type { Product } from '../types/product'

export const products: Product[] = [
  {
    id: 1,
    name: 'Aero Mini',
    category: 'Gadgets',
    price: 12990,
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
    description:
      'Lightweight wireless headphones with crystal-clear sound and a sleek design. Perfect for your favorite playlists, walks, and whatever sounds like you.',
    features: ['Up to 30 hours battery', 'Noise cancellation', 'Fast charging'],
    badge: 'Bestseller',
    tone: 'peach',
  },
  {
    id: 2,
    name: 'Daily Ritual',
    category: 'Beauty',
    price: 3490,
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85',
    description:
      'A small daily self-care ritual. Delicate texture and a simple formula for a peaceful start to your day.',
    features: ['Gentle formula', 'Suitable for daily use', 'Convenient size'],
    badge: 'New',
    tone: 'lilac',
  },
  {
    id: 3,
    name: 'Cloud Knit',
    category: 'Clothing',
    price: 7990,
    rating: '5.0',
    image:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85',
    description:
      'Soft knitwear you will keep reaching for. A comfortable layer for chilly mornings and long weekends.',
    features: ['Soft knitwear', 'Relaxed fit', 'Versatile style'],
    tone: 'blue',
  },
  {
    id: 4,
    name: 'Forma Cup',
    category: 'Home',
    price: 1890,
    rating: '4.7',
    image:
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85',
    description:
      'A ceramic mug with a simple, striking form — for your morning coffee, evening tea, and quiet little breaks.',
    features: ['Ceramic', 'Minimalist design', 'For hot beverages'],
    tone: 'green',
  },
  {
    id: 5,
    name: 'Studio Camera',
    category: 'Gadgets',
    price: 24990,
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85',
    description:
      'A compact camera for those who want to capture more than just a snapshot. Take it along on your next story.',
    features: ['Compact body', 'Photo and video', 'Travel-friendly'],
    tone: 'blue',
  },
  {
    id: 6,
    name: 'Soft Glow Set',
    category: 'Beauty',
    price: 5290,
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85',
    description:
      'A thoughtful skincare set for simple care: a few essential steps that easily fit into your routine.',
    features: ['Skincare set', 'Great for gifting', 'Simple ritual'],
    tone: 'peach',
  },
  {
    id: 7,
    name: 'Weekend Tote',
    category: 'Accessories',
    price: 4590,
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85',
    description:
      'A spacious everyday tote bag with room for your laptop, spontaneous purchases, and weekend plans.',
    features: ['Spacious design', 'Comfortable handles', 'Everyday use'],
    tone: 'lilac',
  },
  {
    id: 8,
    name: 'Sunday Vase',
    category: 'Home',
    price: 2790,
    rating: '4.6',
    image:
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85',
    description:
      'A decorative vase that brings calm to any room — filled with flowers or standing on its own.',
    features: ['Decorative accent', 'Sleek silhouette', 'For fresh flowers'],
    tone: 'green',
  },
]

export const categories = [
  'All Products',
  'Gadgets',
  'Beauty',
  'Clothing',
  'Home',
  'Accessories',
]