'use client'

import { CartItem, ViewType } from '@/types'
import { roundPrice } from '@/lib/utils'

// Maximum quantity per item in cart
const MAX_QUANTITY = 10

interface CartProps {
  setView: (v: ViewType) => void
  cartItems: CartItem[]
  setCartItems: (items: CartItem[]) => void
  onUpdateQuantity?: (id: number, quantity: number) => void
  onRemoveItem?: (id: number) => void
  freeDeliveryMin?: number
}

export default function Cart({ setView, cartItems, setCartItems, onUpdateQuantity, onRemoveItem, freeDeliveryMin = 500 }: CartProps) {
  // Handle quantity change with validation
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    if (newQuantity > MAX_QUANTITY) newQuantity = MAX_QUANTITY
    
    if (onUpdateQuantity) {
      onUpdateQuantity(cartItems[index].id, newQuantity)
    } else {
      const newItems = [...cartItems]
      newItems[index] = { ...newItems[index], quantity: newQuantity }
      setCartItems(newItems)
    }
  }

  // Handle remove item
  const handleRemoveItem = (index: number) => {
    const item = cartItems[index]
    if (onRemoveItem) {
      onRemoveItem(item.id)
    } else {
      const newItems = [...cartItems]
      newItems.splice(index, 1)
      setCartItems(newItems)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-clean-wrapper">
        <div className="cart-clean-container">
          <div className="cart-clean-empty">
            <i className="ri-shopping-cart-2-line" style={{ fontSize: '64px', color: '#d1d5db', display: 'block', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111', marginBottom: '8px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              আপনার কার্ট খালি
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              শপিং শুরু করতে পণ্য যোগ করুন
            </p>
            <button 
              onClick={() => setView('shop')}
              style={{
                padding: '12px 24px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
              }}
            >
              শপিং করুন
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate subtotal using quantity
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * Math.min(item.quantity || 1, MAX_QUANTITY)), 0)
  const totalItems = cartItems.reduce((acc, item) => acc + Math.min(item.quantity || 1, MAX_QUANTITY), 0)
  const remainingForFreeDelivery = freeDeliveryMin - subtotal

  return (
    <div className="cart-clean-wrapper">
      <div className="cart-clean-container">
        
        {/* ITEM LIST */}
        <div className="cart-clean-list">
          {cartItems.map((item, index) => {
            const currentQty = Math.min(item.quantity || 1, MAX_QUANTITY)
            const isAtMax = currentQty >= MAX_QUANTITY
            
            return (
              <div key={item.id} className="cart-clean-item">
                <img src={item.img} className="cart-clean-img" alt={item.name} />
                <div className="cart-clean-info">
                  <div className="cart-clean-name-row">
                    <span className="cart-clean-name">{item.name}</span> 
                    <span className="cart-clean-weight">({item.weight})</span>
                  </div>
                  <div className="cart-clean-action-row">
                    <div className="cart-clean-price">TK {roundPrice(item.price * currentQty)}</div>
                    <div className="cart-clean-qty-group">
                      <button 
                        className="cart-clean-qbtn" 
                        onClick={() => handleQuantityChange(index, currentQty - 1)}
                        disabled={currentQty <= 1}
                        style={{ opacity: currentQty <= 1 ? 0.5 : 1 }}
                      >
                        <i className="ri-subtract-line"></i>
                      </button>
                      <span className="cart-clean-qval">{currentQty}</span>
                      <button 
                        className="cart-clean-qbtn" 
                        onClick={() => handleQuantityChange(index, currentQty + 1)}
                        disabled={isAtMax}
                        style={{ opacity: isAtMax ? 0.5 : 1 }}
                      >
                        <i className="ri-add-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <button className="cart-clean-del" onClick={() => handleRemoveItem(index)}>
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            )
          })}
        </div>

        {/* SUMMARY */}
        <div className="cart-clean-summary">
          <div className="cart-clean-os-row">
            <span>Subtotal ({totalItems} items)</span>
            <span>TK {roundPrice(subtotal)}</span>
          </div>
          <div className="cart-clean-os-row">
            <span>Shipping</span>
            <span className="cart-clean-shipping-text">Calculated at checkout</span>
          </div>
          <div className="cart-clean-os-row cart-clean-total">
            <span>Total</span>
            <span>TK {roundPrice(subtotal)}</span>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="cart-two-buttons">
          <button className="cart-btn-continue-full" onClick={() => setView('shop')}>
            <i className="ri-shopping-bag-line" style={{ marginRight: '8px' }}></i> Shopping
          </button>
          <button className="cart-btn-checkout-full" onClick={() => setView('checkout')}>
            <i className="ri-arrow-right-line" style={{ marginRight: '8px' }}></i> Checkout
          </button>
        </div>

        {/* PROMO BANNER */}
        <div className="cart-clean-promo">
          <div className="cart-clean-promo-icon">
            <i className="ri-truck-line"></i>
          </div>
          <div className="cart-clean-promo-text">
            {remainingForFreeDelivery > 0 ? (
              <>
                Add <strong>TK {roundPrice(remainingForFreeDelivery)}</strong> more to get <strong>FREE delivery!</strong>
              </>
            ) : (
              <>
                🎉 You qualify for <strong>FREE delivery!</strong>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export { MAX_QUANTITY }
