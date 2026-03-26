'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CartItem, ViewType } from '@/types'
import { roundPrice } from '@/lib/utils'
import { cartItemAdd, cartItemRemove, staggerContainer, staggerItem, fadeInUp, buttonTap, counterChange } from '@/lib/animations'

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
    // Validate: minimum 1, maximum MAX_QUANTITY
    if (newQuantity < 1) return
    if (newQuantity > MAX_QUANTITY) {
      newQuantity = MAX_QUANTITY
    }
    
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
      <motion.div 
        className="cart-clean-wrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="cart-clean-container">
          <motion.div 
            className="cart-clean-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <motion.i 
              className="ri-shopping-cart-2-line" 
              style={{ fontSize: '64px', color: '#d1d5db', display: 'block', marginBottom: '16px' }}
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111', marginBottom: '8px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              আপনার কার্ট খালি
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
              শপিং শুরু করতে পণ্য যোগ করুন
            </p>
            <motion.button 
              onClick={() => setView('shop')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Calculate subtotal using quantity
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * Math.min(item.quantity || 1, MAX_QUANTITY)), 0)
  const totalItems = cartItems.reduce((acc, item) => acc + Math.min(item.quantity || 1, MAX_QUANTITY), 0)
  const remainingForFreeDelivery = freeDeliveryMin - subtotal

  return (
    <motion.div 
      className="cart-clean-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="cart-clean-container">
        
        {/* ITEM LIST WITH STAGGERED ANIMATION */}
        <motion.div 
          className="cart-clean-list"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {cartItems.map((item, index) => {
              const currentQty = Math.min(item.quantity || 1, MAX_QUANTITY)
              const isAtMax = currentQty >= MAX_QUANTITY
              
              return (
                <motion.div 
                  key={item.id} 
                  className="cart-clean-item"
                  variants={cartItemAdd}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                  layoutId={`cart-item-${item.id}`}
                >
                  <motion.img 
                    src={item.img} 
                    className="cart-clean-img" 
                    alt={item.name}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="cart-clean-info">
                    <div className="cart-clean-name-row">
                      <span className="cart-clean-name">{item.name}</span> 
                      <span className="cart-clean-weight">({item.weight})</span>
                    </div>
                    <div className="cart-clean-action-row">
                      <motion.div 
                        className="cart-clean-price"
                        key={subtotal}
                        variants={counterChange}
                        initial="initial"
                        animate="change"
                      >
                        TK {roundPrice(item.price * currentQty)}
                      </motion.div>
                      <div className="cart-clean-qty-group">
                        <motion.button 
                          className="cart-clean-qbtn" 
                          onClick={() => handleQuantityChange(index, currentQty - 1)}
                          disabled={currentQty <= 1}
                          style={{ opacity: currentQty <= 1 ? 0.5 : 1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ duration: 0.1 }}
                        >
                          <i className="ri-subtract-line"></i>
                        </motion.button>
                        <motion.span 
                          className="cart-clean-qval"
                          key={currentQty}
                          initial={{ opacity: 0.5, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        >
                          {currentQty}
                        </motion.span>
                        <motion.button 
                          className="cart-clean-qbtn" 
                          onClick={() => handleQuantityChange(index, currentQty + 1)}
                          disabled={isAtMax}
                          style={{ opacity: isAtMax ? 0.5 : 1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ duration: 0.1 }}
                        >
                          <i className="ri-add-line"></i>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <motion.button 
                    className="cart-clean-del" 
                    onClick={() => handleRemoveItem(index)}
                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <i className="ri-delete-bin-line"></i>
                  </motion.button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* SUMMARY */}
        <motion.div 
          className="cart-clean-summary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="cart-clean-os-row">
            <span>Subtotal ({totalItems} items)</span>
            <motion.span
              key={subtotal}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              TK {roundPrice(subtotal)}
            </motion.span>
          </div>
          <div className="cart-clean-os-row">
            <span>Shipping</span>
            <span className="cart-clean-shipping-text">Calculated at checkout</span>
          </div>
          <div className="cart-clean-os-row cart-clean-total">
            <span>Total</span>
            <motion.span
              key={subtotal}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              TK {roundPrice(subtotal)}
            </motion.span>
          </div>
        </motion.div>

        {/* BUTTONS */}
        <motion.div 
          className="cart-two-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button 
            className="cart-btn-continue-full" 
            onClick={() => setView('shop')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <i className="ri-shopping-bag-line" style={{ marginRight: '8px' }}></i> Shopping
          </motion.button>
          <motion.button 
            className="cart-btn-checkout-full" 
            onClick={() => setView('checkout')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <i className="ri-arrow-right-line" style={{ marginRight: '8px' }}></i> Checkout
          </motion.button>
        </motion.div>

        {/* PROMO BANNER */}
        <motion.div 
          className="cart-clean-promo"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <motion.div 
            className="cart-clean-promo-icon"
            animate={{ 
              x: [0, 5, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <i className="ri-truck-line"></i>
          </motion.div>
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
        </motion.div>

      </div>
    </motion.div>
  )
}

// Export max quantity for use in other components
export { MAX_QUANTITY }
