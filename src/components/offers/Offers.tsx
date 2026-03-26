'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Coupon, ViewType } from '@/types'
import { useShopStore } from '@/store'
import { roundPrice } from '@/lib/utils'

interface OffersProps {
  setView?: (v: ViewType, params?: Record<string, string>) => void
}

interface OfferProduct {
  id: number
  name: string
  image: string
  discount: string
  discountType: 'pct' | 'fixed'
  discountValue: number
  price: number
}

// Bengali digit mapping
const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

const toBengaliDigits = (num: number): string => {
  return num.toString().split('').map(d => bengaliDigits[parseInt(d)] || d).join('')
}

const formatBengaliCurrency = (amount: number): string => {
  return `৳${toBengaliDigits(amount)}`
}

// Product icons based on category/product name
const getProductIcon = (name: string): string => {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('ডাল') || nameLower.includes('dal')) return 'ri-restaurant-line'
  if (nameLower.includes('লবণ') || nameLower.includes('লবন') || nameLower.includes('salt')) return 'ri-flask-line'
  if (nameLower.includes('তেল') || nameLower.includes('oil')) return 'ri-drop-line'
  if (nameLower.includes('চাল') || nameLower.includes('rice')) return 'ri-seedling-line'
  if (nameLower.includes('চিনি') || nameLower.includes('sugar')) return 'ri-cake-2-line'
  if (nameLower.includes('মশলা') || nameLower.includes('spice')) return 'ri-fire-line'
  if (nameLower.includes('দুধ') || nameLower.includes('milk')) return 'ri-cup-line'
  if (nameLower.includes('পানি') || nameLower.includes('water')) return 'ri-drop-line'
  if (nameLower.includes('সাবান') || nameLower.includes('soap')) return 'ri-hand-sanitizer-line'
  if (nameLower.includes('ফল') || nameLower.includes('fruit')) return 'ri-apple-line'
  if (nameLower.includes('সবজি') || nameLower.includes('vegetable')) return 'ri-leaf-line'
  if (nameLower.includes('মাংস') || nameLower.includes('meat')) return 'ri-restaurant-2-line'
  if (nameLower.includes('মাছ') || nameLower.includes('fish')) return 'ri-fish-line'
  return 'ri-shopping-bag-line'
}

// Format discount text in Bengali
const formatDiscountText = (discountType: 'pct' | 'fixed', discountValue: number): string => {
  if (discountType === 'pct') {
    return `${toBengaliDigits(discountValue)}% বিশেষ ছাড়`
  } else {
    return `${formatBengaliCurrency(discountValue)} সরাসরি ছাড়`
  }
}

export default function Offers({ setView }: OffersProps) {
  const router = useRouter()
  const { settings, products, fetchData, settingsLoaded } = useShopStore()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!settingsLoaded) {
      fetchData()
    }
  }, [fetchData, settingsLoaded])

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch('/api/coupons?public=true')
        const data = await response.json()
        if (data.success && data.coupons) {
          setCoupons(data.coupons)
        }
      } catch (error) {
        console.error('Error fetching coupons:', error)
      }
    }
    fetchCoupons()
  }, [])

  // Get offer products (products with offer=true or discountValue > 0)
  const offerProducts: OfferProduct[] = products
    .filter(p => p.offer === true || (p.discountValue && p.discountValue > 0))
    .slice(0, 6)
    .map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      discount: p.discount || '0%',
      discountType: (p.discountType as 'pct' | 'fixed') || 'pct',
      discountValue: p.discountValue || 0,
      price: p.price || 0
    }))

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleProductClick = (product: OfferProduct) => {
    // Navigate to product page using the product name as slug
    const slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
    router.push(`/${slug}`)
  }

  const handleHomeClick = () => {
    router.push('/')
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <style jsx>{`
        .container { 
          max-width: 400px; 
          margin: 0 auto; 
          padding: 20px 15px;
          font-family: 'Hind Siliguri', sans-serif;
        }

        .section-label { 
          font-size: 17px; 
          font-weight: 700; 
          margin-bottom: 12px; 
          display: block; 
          color: #1f2937;
        }

        /* ১. ফ্রি ডেলিভারি ব্যানার */
        .delivery-banner {
          background-color: #16a34a;
          color: #ffffff;
          padding: 16px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 25px;
        }
        .delivery-banner i { font-size: 30px; }
        .delivery-banner h2 { font-size: 18px; line-height: 1.2; font-weight: 700; }
        .delivery-banner p { font-size: 12px; opacity: 0.9; }

        /* ২. কুপন সেকশন (Vertical with Icon Only) */
        .coupon-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 30px;
        }

        .coupon-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 12px 15px;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .coupon-info h4 { font-size: 15px; font-weight: 700; color: #1f2937; }
        .coupon-info p { font-size: 12px; color: #6b7280; }

        .coupon-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .coupon-code {
          font-size: 13px;
          font-weight: 700;
          color: #16a34a;
          background: #f9fafb;
          padding: 4px 10px;
          border: 1px dashed #16a34a;
          border-radius: 5px;
        }

        .copy-icon-btn {
          background-color: #16a34a;
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 5px;
          font-size: 18px;
          transition: 0.2s;
        }

        .copy-icon-btn:active { transform: scale(0.9); }
        .copy-icon-btn.copied { background-color: #15803d; }

        /* ৩. ডিসকাউন্ট প্রোডাক্ট কার্ড */
        .product-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 5px;
          margin-bottom: 10px;
          background: #ffffff;
          cursor: pointer;
          transition: 0.2s;
        }

        .product-item:hover { background: #f9fafb; }

        .product-main { display: flex; align-items: center; gap: 10px; }

        .product-icon {
          width: 42px;
          height: 42px;
          background-color: #f9fafb;
          color: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          font-size: 24px;
          overflow: hidden;
        }

        .product-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-details {
          display: flex;
          flex-direction: column;
          gap: 0px;
        }

        .product-details h4 { 
          font-size: 15px; 
          font-weight: 600; 
          line-height: 1; 
          margin-bottom: 3px;
          color: #1f2937;
        }

        .product-details .promo-line { 
          font-size: 13px; 
          font-weight: 700; 
          color: #16a34a; 
          line-height: 1; 
        }

        /* কিনুন বাটন উইথ ফ্ল্যাশ আইকন */
        .buy-now-btn {
          background-color: #16a34a;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 5px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          border: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .buy-now-btn:hover { background-color: #15803d; }
        .buy-now-btn i { font-size: 15px; }

        .no-products {
          text-align: center;
          padding: 30px;
          color: #6b7280;
        }

        .no-products i {
          font-size: 40px;
          color: #d1d5db;
          margin-bottom: 10px;
        }
      `}</style>

      <div className="container">
        {/* ১. ফ্রি ডেলিভারি ব্যানার */}
        <div className="delivery-banner">
          <i className="ri-truck-line"></i>
          <div>
            <h2>ফ্রি ডেলিভারি অফার!</h2>
            <p>৳{toBengaliDigits(settings.freeDeliveryMin || 599)} বা তার বেশি অর্ডারে ডেলিভারি চার্জ নেই</p>
          </div>
        </div>

        {/* ২. কুপন সেকশন (Vertical with Copy Icon) */}
        {coupons.length > 0 && (
          <>
            <span className="section-label">ডিসকাউন্ট কুপনসমূহ</span>
            <div className="coupon-stack">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="coupon-card">
                  <div className="coupon-info">
                    <h4>
                      {coupon.type === 'pct' 
                        ? `${toBengaliDigits(coupon.value)}% বিশেষ ছাড়` 
                        : `${formatBengaliCurrency(coupon.value)} ফ্ল্যাট ডিসকাউন্ট`}
                    </h4>
                    <p>
                      {coupon.scope === 'all' && 'সকল পণ্যে প্রযোজ্য'}
                      {coupon.scope === 'products' && 'নির্বাচিত পণ্যে'}
                      {coupon.scope === 'categories' && 'নির্বাচিত ক্যাটাগরিতে'}
                    </p>
                  </div>
                  <div className="coupon-right">
                    <span className="coupon-code">{coupon.code}</span>
                    <button 
                      className={`copy-icon-btn ${copiedCode === coupon.code ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(coupon.code)}
                    >
                      <i className={copiedCode === coupon.code ? 'ri-check-line' : 'ri-file-copy-line'}></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ৩. ডিসকাউন্ট পণ্যসমূহ */}
        <div className="product-section">
          <span className="section-label">সেরা ডিসকাউন্ট পণ্য</span>

          {offerProducts.length > 0 ? (
            offerProducts.map((product) => (
              <div 
                key={product.id} 
                className="product-item"
                onClick={() => handleProductClick(product)}
              >
                <div className="product-main">
                  <div className="product-icon">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <i className={getProductIcon(product.name)}></i>
                    )}
                  </div>
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <span className="promo-line">{formatDiscountText(product.discountType, product.discountValue)}</span>
                  </div>
                </div>
                <button className="buy-now-btn" onClick={(e) => {
                  e.stopPropagation()
                  handleProductClick(product)
                }}>
                  <i className="ri-flashlight-fill"></i> কিনুন
                </button>
              </div>
            ))
          ) : (
            <div className="no-products">
              <i className="ri-gift-line"></i>
              <p>বর্তমানে কোন ডিসকাউন্ট পণ্য নেই</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
