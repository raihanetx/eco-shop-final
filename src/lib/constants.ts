import { CartItem } from '@/types'

// Products for Shop page
export const shopProducts: CartItem[] = [
  { id: 1, name: 'Fresh Organic Carrots', price: 80, oldPrice: 95, img: 'https://i.postimg.cc/B6sD1hKt/1000020579-removebg-preview.png', weight: '1 KG', quantity: 1 },
  { id: 2, name: 'Premium Potatoes', price: 45, oldPrice: 55, img: 'https://i.postimg.cc/d1vdTWyL/1000020583-removebg-preview.png', weight: '1 KG', quantity: 1 },
  { id: 3, name: 'Fresh Tomatoes', price: 60, oldPrice: 75, img: 'https://i.postimg.cc/mr7CkxtQ/1000020584-removebg-preview.png', weight: '500g', quantity: 1 },
  { id: 4, name: 'Organic Spinach', price: 30, oldPrice: 40, img: 'https://i.postimg.cc/MG1VHkvz/1000020586-removebg-preview.png', weight: '1 Bundle', quantity: 1 },
  { id: 5, name: 'Crisp Cucumbers', price: 50, oldPrice: 65, img: 'https://i.postimg.cc/TPng18pY/1000020587-removebg-preview.png', weight: '1 KG', quantity: 1 },
  { id: 6, name: 'Fresh Onions', price: 35, oldPrice: 45, img: 'https://i.postimg.cc/1zDwXxfR/1000020590-removebg-preview.png', weight: '1 KG', quantity: 1 },
  { id: 7, name: 'Green Peppers', price: 55, oldPrice: 70, img: 'https://i.postimg.cc/TPng18pL/1000020591-removebg-preview.png', weight: '500g', quantity: 1 },
  { id: 8, name: 'Fresh Garlic', price: 40, oldPrice: 50, img: 'https://i.postimg.cc/mr7Ckxt4/1000020592-removebg-preview.png', weight: '250g', quantity: 1 },
  { id: 9, name: 'Organic Ginger', price: 45, oldPrice: 55, img: 'https://i.postimg.cc/K86tmcvZ/1000020593-removebg-preview.png', weight: '200g', quantity: 1 },
  { id: 10, name: 'Fresh Broccoli', price: 70, oldPrice: 85, img: 'https://i.postimg.cc/qR0nCm36/1000020611-removebg-preview.png', weight: '1 Piece', quantity: 1 },
  { id: 11, name: 'Red Apples', price: 90, oldPrice: 110, img: 'https://i.postimg.cc/x1wL9jTV/IMG-20260228-163137.png', weight: '1 KG', quantity: 1 },
  { id: 12, name: 'Fresh Bananas', price: 50, oldPrice: 60, img: 'https://i.postimg.cc/bw71qYYK/IMG-20260228-163147.png', weight: '1 Dozen', quantity: 1 },
  { id: 13, name: 'Sweet Oranges', price: 80, oldPrice: 95, img: 'https://i.postimg.cc/mr7Ckxtx/IMG-20260228-163156.png', weight: '1 KG', quantity: 1 },
  { id: 14, name: 'Grapes Green', price: 120, oldPrice: 140, img: 'https://i.postimg.cc/htkVK4PD/IMG-20260228-163208.png', weight: '500g', quantity: 1 },
  { id: 15, name: 'Mango Fresh', price: 150, oldPrice: 180, img: 'https://i.postimg.cc/Z5G6JYKm/IMG-20260228-163217.png', weight: '1 KG', quantity: 1 },
  { id: 16, name: 'Papaya Ripe', price: 60, oldPrice: 75, img: 'https://i.postimg.cc/vZJ5G8Hd/IMG-20260228-163228.png', weight: '1 Piece', quantity: 1 }
]

// Hero carousel images
export const heroImages = [
  'https://i.postimg.cc/zfN3dyGV/Whisk-785426d5b3a55ac9f384abb1c653efdedr.jpg',
  'https://i.postimg.cc/QCFMB50H/Whisk-186f0227f2203638e6f4806f9343b15cdr.jpg',
  'https://i.postimg.cc/0jzN6mcM/Whisk-21cf4f35609655e91844ef8ae3c7f4c9dr.jpg',
  'https://i.postimg.cc/8c7CFWtv/Whisk-2215d2b37231bb1a2ec403753c88d38fdr.jpg',
  'https://i.postimg.cc/mkPrcM83/Whisk-6915ce64bba40ba9e924b2c9991fd1f7dr.jpg',
  'https://i.postimg.cc/x8XdkHtL/Whisk-7725ed9fada3d57b47746dad0037a667dr.jpg',
  'https://i.postimg.cc/j2DjWNZX/Whisk-92ca7933c1a594782e4409c2912ffaebdr.jpg',
  'https://i.postimg.cc/mkPrcM8P/Whisk-fca8a55bd19b6f9a49c4cafbfd6d5bd5dr.jpg',
]

// Categories for shop (without count)
export const shopCategories = [
  { icon: 'ri-plant-line', name: 'Vegetables' },
  { icon: 'ri-apple-line', name: 'Fruits' },
  { icon: 'ri-drop-line', name: 'Dairy' },
  { icon: 'ri-cup-line', name: 'Beverages' },
  { icon: 'ri-restaurant-line', name: 'Meat' },
  { icon: 'ri-cookie-line', name: 'Snacks' },
]

// Related products for product detail
export const relatedProducts = [
  { id: 1, name: 'Fresh Carrots', price: 80, oldPrice: 95, img: 'https://i.postimg.cc/B6sD1hKt/1000020579-removebg-preview.png', weight: '500g', discount: 16, rating: 4.8, reviews: 124 },
  { id: 2, name: 'Premium Potatoes', price: 45, oldPrice: 55, img: 'https://i.postimg.cc/d1vdTWyL/1000020583-removebg-preview.png', weight: '1 KG', discount: 18, rating: 4.6, reviews: 89 },
  { id: 3, name: 'Fresh Tomatoes', price: 60, oldPrice: 75, img: 'https://i.postimg.cc/mr7CkxtQ/1000020584-removebg-preview.png', weight: '500g', discount: 20, rating: 4.9, reviews: 156 },
  { id: 4, name: 'Red Apples', price: 90, oldPrice: 110, img: 'https://i.postimg.cc/x1wL9jTV/IMG-20260228-163137.png', weight: '1 KG', discount: 18, rating: 4.7, reviews: 203 },
]

// Logo URL
export const logoUrl = 'https://i.postimg.cc/4xZk3k2j/IMG-20260226-120143.png'

// Settings
export const settings = {
  slogan: 'Your trusted marketplace for fresh organic products and groceries.',
}
