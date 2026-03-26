'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <style jsx>{`
        .not-found-container {
          font-family: 'Hind Siliguri', sans-serif;
          text-align: center;
          max-width: 400px;
        }

        .error-code {
          font-size: 120px;
          font-weight: 800;
          color: #16a34a;
          line-height: 1;
          margin-bottom: 16px;
          text-shadow: 4px 4px 0 rgba(22, 163, 74, 0.1);
        }

        .error-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .error-message {
          font-size: 15px;
          color: #64748b;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .home-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #16a34a;
          color: white;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        .home-btn:hover {
          background: #15803d;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
        }

        .home-btn:active {
          transform: translateY(0);
        }

        .decorative-icon {
          font-size: 48px;
          color: #16a34a;
          margin-bottom: 24px;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .suggestions {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .suggestions-title {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .suggestion-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .suggestion-link {
          padding: 8px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .suggestion-link:hover {
          border-color: #16a34a;
          color: #16a34a;
        }
      `}</style>

      <div className="not-found-container">
        {/* Decorative Icon */}
        <div className="decorative-icon">
          <i className="ri-plant-line"></i>
        </div>

        {/* Error Code */}
        <div className="error-code">404</div>

        {/* Title in Bengali */}
        <h1 className="error-title">পেজটি পাওয়া যায়নি</h1>

        {/* Message in Bengali */}
        <p className="error-message">
          আপনি যে পেজটি খুঁজছেন তা বিদ্যমান নেই বা স্থানান্তরিত হয়েছে। অনুগ্রহ করে হোম পেজে ফিরে যান।
        </p>

        {/* Home Button */}
        <Link href="/" className="home-btn">
          <i className="ri-home-4-line"></i>
          হোম পেজে যান
        </Link>

        {/* Suggestions */}
        <div className="suggestions">
          <p className="suggestions-title">দ্রুত লিঙ্ক</p>
          <div className="suggestion-links">
            <Link href="/" className="suggestion-link">
              <i className="ri-store-2-line"></i> পণ্য
            </Link>
            <Link href="/checkout" className="suggestion-link">
              <i className="ri-shopping-cart-line"></i> কার্ট
            </Link>
            <Link href="/history" className="suggestion-link">
              <i className="ri-history-line"></i> অর্ডার
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
