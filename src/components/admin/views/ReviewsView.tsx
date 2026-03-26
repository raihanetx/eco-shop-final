'use client'

import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/components/admin/context/AdminContext'

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1'

const ReviewsView: React.FC = () => {
  const { adminReviews, setAdminReviews, showToastMsg } = useAdmin()
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')

  const filteredReviews = useMemo(() => {
    if (ratingFilter === 'all') return adminReviews
    return adminReviews.filter(r => r.rating === parseInt(ratingFilter))
  }, [adminReviews, ratingFilter])

  const ratingCounts = useMemo(() => ({
    all: adminReviews.length,
    5: adminReviews.filter(r => r.rating === 5).length,
    4: adminReviews.filter(r => r.rating === 4).length,
    3: adminReviews.filter(r => r.rating === 3).length,
    2: adminReviews.filter(r => r.rating === 2).length,
    1: adminReviews.filter(r => r.rating === 1).length,
  }), [adminReviews])

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    
    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setAdminReviews(adminReviews.filter(r => r.id !== reviewId))
        showToastMsg('Review deleted successfully!')
      } else {
        showToastMsg('Failed to delete review')
      }
    } catch (error) {
      showToastMsg('Failed to delete review')
    }
  }

  return (
    <div className="p-4 md:p-8 bg-white min-h-[calc(100vh-80px)]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setRatingFilter('all')} className={`px-4 py-2 text-sm font-medium transition-all border ${ratingFilter === 'all' ? 'border-[#1e293b] text-[#1e293b] bg-[#1e293b]/5' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>All ({ratingCounts.all})</button>
        <button onClick={() => setRatingFilter('5')} className={`px-4 py-2 text-sm font-medium transition-all border ${ratingFilter === '5' ? 'border-[#16a34a] text-[#16a34a] bg-green-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>★5 ({ratingCounts[5]})</button>
        <button onClick={() => setRatingFilter('4')} className={`px-4 py-2 text-sm font-medium transition-all border ${ratingFilter === '4' ? 'border-[#16a34a] text-[#16a34a] bg-green-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>★4 ({ratingCounts[4]})</button>
        <button onClick={() => setRatingFilter('3')} className={`px-4 py-2 text-sm font-medium transition-all border ${ratingFilter === '3' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>★3 ({ratingCounts[3]})</button>
        <button onClick={() => setRatingFilter('2')} className={`px-4 py-2 text-sm font-medium transition-all border ${ratingFilter === '2' ? 'border-red-500 text-red-600 bg-red-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>★2 ({ratingCounts[2]})</button>
        <button onClick={() => setRatingFilter('1')} className={`px-4 py-2 text-sm font-medium transition-all border ${ratingFilter === '1' ? 'border-red-500 text-red-600 bg-red-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>★1 ({ratingCounts[1]})</button>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="grid grid-cols-12 bg-[#f1f5f9] border border-[#e2e8f0]" style={{ borderRadius: '5px' }}>
          <div className="col-span-3 px-4 py-3 border-r border-[#e2e8f0] text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Product • Rating • Date</div>
          <div className="col-span-7 px-4 py-3 border-r border-[#e2e8f0] text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Review</div>
          <div className="col-span-2 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Action</div>
        </div>

        {/* Rows */}
        {filteredReviews.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] p-12 text-center" style={{ borderRadius: '5px' }}>
            <p className="text-[#94a3b8] text-sm">No reviews found.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="grid grid-cols-12 bg-white border border-[#e2e8f0] hover:border-[#94a3b8] transition-all" style={{ borderRadius: '5px' }}>
              {/* Product • Rating • Date */}
              <div className="col-span-3 px-4 py-3 border-r border-[#e2e8f0] flex flex-col justify-center">
                <p className="text-[13px] font-semibold text-[#1e293b] truncate">{review.product}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className={`ri-star-${star <= review.rating ? 'fill' : 'line'}`} style={{ fontSize: '11px', color: star <= review.rating ? '#f59e0b' : '#e4e7ee' }}></i>
                    ))}
                  </div>
                  <span className="text-[#94a3b8]">•</span>
                  <span className="text-[11px] text-[#94a3b8]">{review.date}</span>
                </div>
              </div>
              
              {/* Review */}
              <div className="col-span-7 px-4 py-3 border-r border-[#e2e8f0] flex items-center">
                <p className="text-[12px] text-[#64748b] leading-relaxed line-clamp-2">{review.text}</p>
              </div>
              
              {/* Action */}
              <div className="col-span-2 px-4 py-3 flex items-center justify-center">
                <button onClick={() => handleDeleteReview(review.id)} className="px-3 py-1.5 text-[11px] font-medium text-[#ef4444] border border-[#fecaca] hover:bg-[#fef2f2] transition-colors" style={{ borderRadius: '5px' }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ReviewsView
