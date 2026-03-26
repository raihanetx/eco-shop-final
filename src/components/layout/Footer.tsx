'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ViewType } from '@/types'

interface FooterSettings {
  websiteName: string
  slogan: string
  whatsappNumber: string
  phoneNumber: string
  facebookUrl: string
  messengerUsername: string
}

interface FooterProps {
  setView?: (v: ViewType) => void
}

export default function Footer({ setView }: FooterProps) {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [settings, setSettings] = useState<FooterSettings>({
    websiteName: 'EcoMart',
    slogan: 'Your trusted marketplace for fresh organic products and groceries.',
    whatsappNumber: '',
    phoneNumber: '',
    facebookUrl: '',
    messengerUsername: ''
  })

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.success && data.data) {
          setSettings({
            websiteName: data.data.websiteName || 'EcoMart',
            slogan: data.data.slogan || 'Your trusted marketplace for fresh organic products and groceries.',
            whatsappNumber: data.data.whatsappNumber || '',
            phoneNumber: data.data.phoneNumber || '',
            facebookUrl: data.data.facebookUrl || '',
            messengerUsername: data.data.messengerUsername || ''
          })
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Parse store name for display (e.g., "EcoMart" -> "Eco" + "Mart")
  const nameParts = settings.websiteName.split(/([A-Z][a-z]+)/).filter(Boolean)
  const firstNamePart = nameParts[0] || settings.websiteName
  const restNamePart = nameParts.slice(1).join('') || ''

  // Build social links
  const whatsappLink = settings.whatsappNumber 
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}` 
    : '#'
  const phoneLink = settings.phoneNumber 
    ? `tel:${settings.phoneNumber}` 
    : '#'
  const messengerLink = settings.messengerUsername 
    ? `https://m.me/${settings.messengerUsername}` 
    : '#'
  
  // Navigation handler with proper routing
  const handleNav = (view: ViewType) => {
    window.scrollTo(0, 0)
    
    switch (view) {
      case 'shop':
        router.push('/')
        break
      case 'cart':
        router.push('/cart')
        break
      case 'checkout':
        router.push('/checkout')
        break
      case 'orders':
        router.push('/history')
        break
      case 'profile':
        router.push('/profile')
        break
      case 'offers':
        router.push('/offers')
        break
      case 'about':
      case 'terms':
      case 'refund':
      case 'privacy':
        router.push(`/?page=${view}`)
        break
    }
  }
  
  return (
    <footer className="footer" style={{
      position: 'relative',
      background: '#f0fdf4',
      borderTop: '1px solid #bbf7d0'
    }}>
      <div className="footer-container" style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '0.875rem 1rem 3.5rem'
      }}>
        {/* Mobile Layout */}
        <div className="footer-mobile" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.875rem'
        }}>
          <a href="/" className="footer-logo" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <h2 className="footer-logo-text" style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#111827',
              fontFamily: 'Inter, sans-serif'
            }}>
              {firstNamePart}<span style={{ color: '#16a34a' }}>{restNamePart}</span>
            </h2>
          </a>
          
          <p className="footer-slogan" style={{
            fontSize: '0.75rem',
            color: '#4b5563',
            maxWidth: '18rem',
            lineHeight: 1.4
          }}>
            {settings.slogan || 'Your trusted marketplace for fresh organic products and groceries.'}
          </p>
          
          <div className="footer-links" style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem'
          }}>
            <button onClick={() => handleNav('about')} className="footer-link" style={{ color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>About Us</button>
            <span style={{ color: '#bbf7d0' }}>•</span>
            <button onClick={() => handleNav('terms')} className="footer-link" style={{ color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>Terms</button>
            <span style={{ color: '#bbf7d0' }}>•</span>
            <button onClick={() => handleNav('refund')} className="footer-link" style={{ color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>Refund</button>
            <span style={{ color: '#bbf7d0' }}>•</span>
            <button onClick={() => handleNav('privacy')} className="footer-link" style={{ color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>Privacy</button>
          </div>
          
          <div className="footer-social" style={{ display: 'flex', gap: '0.5rem' }}>
            <a href={settings.facebookUrl || '#'} aria-label="Facebook" style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '6px',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              background: '#ffffff'
            }}>
              <i className="ri-facebook-fill" style={{ fontSize: '0.875rem' }}></i>
            </a>
            <a href={messengerLink} aria-label="Messenger" style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '6px',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              background: '#ffffff'
            }}>
              <i className="ri-messenger-fill" style={{ fontSize: '0.875rem' }}></i>
            </a>
            <a href={whatsappLink} aria-label="WhatsApp" style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '6px',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              background: '#ffffff'
            }}>
              <i className="ri-whatsapp-fill" style={{ fontSize: '0.875rem' }}></i>
            </a>
            <a href={phoneLink} aria-label="Phone" style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '6px',
              border: '1px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              textDecoration: 'none',
              transition: 'all 0.2s',
              background: '#ffffff'
            }}>
              <i className="ri-phone-fill" style={{ fontSize: '0.875rem' }}></i>
            </a>
          </div>
          
          <p className="footer-copyright" style={{
            fontSize: '0.6875rem',
            color: '#6b7280'
          }}>
            © {currentYear} {settings.websiteName}
          </p>
        </div>
        
        {/* Desktop Layout */}
        <div className="footer-desktop" style={{ display: 'none' }}>
          <div className="footer-main" style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '3rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #bbf7d0'
          }}>
            <div className="footer-brand" style={{ maxWidth: '14rem' }}>
              <a href="/" style={{ display: 'inline-block', marginBottom: '0.5rem', textDecoration: 'none' }}>
                <h2 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#111827',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {firstNamePart}<span style={{ color: '#16a34a' }}>{restNamePart}</span>
                </h2>
              </a>
              <p style={{
                fontSize: '0.75rem',
                color: '#4b5563',
                lineHeight: 1.5
              }}>
                {settings.slogan || 'Your trusted marketplace for fresh organic products and groceries.'}
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '3rem'
            }}>
              <div>
                <h4 style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.625rem'
                }}>Shop</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <li><button onClick={() => handleNav('shop')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>All Products</button></li>
                  <li><button onClick={() => handleNav('shop')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Fruits & Vegetables</button></li>
                  <li><button onClick={() => handleNav('shop')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Dairy & Eggs</button></li>
                </ul>
              </div>
              
              <div>
                <h4 style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.625rem'
                }}>Company</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <li><button onClick={() => handleNav('about')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>About Us</button></li>
                  <li><button onClick={() => handleNav('orders')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>My Orders</button></li>
                </ul>
              </div>
              
              <div>
                <h4 style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.625rem'
                }}>Policies</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <li><button onClick={() => handleNav('terms')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Terms & Conditions</button></li>
                  <li><button onClick={() => handleNav('refund')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Refund Policy</button></li>
                  <li><button onClick={() => handleNav('privacy')} style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Privacy Policy</button></li>
                </ul>
              </div>
              
              <div>
                <h4 style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: '#16a34a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.625rem'
                }}>Connect</h4>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <a href={settings.facebookUrl || '#'} aria-label="Facebook" style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '5px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: '#ffffff'
                  }}>
                    <i className="ri-facebook-fill" style={{ fontSize: '0.75rem' }}></i>
                  </a>
                  <a href={messengerLink} aria-label="Messenger" style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '5px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: '#ffffff'
                  }}>
                    <i className="ri-messenger-fill" style={{ fontSize: '0.75rem' }}></i>
                  </a>
                  <a href={whatsappLink} aria-label="WhatsApp" style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '5px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: '#ffffff'
                  }}>
                    <i className="ri-whatsapp-fill" style={{ fontSize: '0.75rem' }}></i>
                  </a>
                  <a href={phoneLink} aria-label="Phone" style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '5px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: '#ffffff'
                  }}>
                    <i className="ri-phone-fill" style={{ fontSize: '0.75rem' }}></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <p style={{
              fontSize: '0.6875rem',
              color: '#6b7280'
            }}>
              © {currentYear} {settings.websiteName}. All rights reserved.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.6875rem'
            }}>
              <button onClick={() => handleNav('about')} style={{ color: '#6b7280', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>About Us</button>
              <span style={{ color: '#86efac' }}>•</span>
              <button onClick={() => handleNav('terms')} style={{ color: '#6b7280', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>Terms</button>
              <span style={{ color: '#86efac' }}>•</span>
              <button onClick={() => handleNav('refund')} style={{ color: '#6b7280', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>Refund</button>
              <span style={{ color: '#86efac' }}>•</span>
              <button onClick={() => handleNav('privacy')} style={{ color: '#6b7280', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>Privacy</button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @media (min-width: 1024px) {
          .footer-container {
            padding: 2rem 3.5rem 2rem !important;
          }
          .footer-mobile {
            display: none !important;
          }
          .footer-desktop {
            display: block !important;
          }
        }
        
        .footer-link:hover,
        .footer-desktop ul button:hover,
        .footer-desktop > div:last-child button:hover {
          color: #16a34a !important;
        }
        
        .footer-social a:hover {
          background: #16a34a !important;
          color: white !important;
          border-color: #16a34a !important;
        }
      `}</style>
    </footer>
  )
}
