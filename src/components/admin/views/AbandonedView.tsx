'use client'

import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/components/admin/context/AdminContext'
import type { AbandonedProduct } from '@/types'
import { roundPrice } from '@/lib/utils'

type AbandonedFilter = 'all' | 'new' | 'returning' | 'high-value'

const AbandonedView: React.FC = () => {
  const { abandonedCheckouts } = useAdmin()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [filter, setFilter] = useState<AbandonedFilter>('all')

  const getInitials = (name: string) => {
    if (!name || name === 'Unknown') return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const buildProducts = (products: AbandonedProduct[]) => {
    if (!products || !Array.isArray(products)) return []
    const items: { name: string; weight: string; count: number }[] = []
    products.forEach(p => {
      if (p && p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => items.push({ name: p.name, weight: v.label || '', count: v.qty }))
      }
    })
    return items
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatCheckout = (seconds: number | undefined) => {
    if (!seconds || seconds === 0) return '—'
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      let result = `${mins} minute`
      if (secs > 0) result += ` ${secs} second`
      return result
    }
    return `${seconds} second`
  }

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: abandonedCheckouts.length,
    new: abandonedCheckouts.filter(ab => ab.totalVisits === 1).length,
    returning: abandonedCheckouts.filter(ab => ab.totalVisits > 1).length,
    highValue: abandonedCheckouts.filter(ab => Math.max(...(ab.history || []).map(h => h.total || 0)) >= 500).length,
  }), [abandonedCheckouts])

  // Filter
  const filteredCheckouts = useMemo(() => {
    if (filter === 'all') return abandonedCheckouts
    if (filter === 'new') return abandonedCheckouts.filter(ab => ab.totalVisits === 1)
    if (filter === 'returning') return abandonedCheckouts.filter(ab => ab.totalVisits > 1)
    if (filter === 'high-value') return abandonedCheckouts.filter(ab => Math.max(...(ab.history || []).map(h => h.total || 0)) >= 500)
    return abandonedCheckouts
  }, [abandonedCheckouts, filter])

  return (
    <div className="p-4 md:p-8 bg-white min-h-[calc(100vh-80px)]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium transition-all border ${filter === 'all' ? 'border-[#1e293b] text-[#1e293b] bg-[#1e293b]/5' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>All ({filterCounts.all})</button>
        <button onClick={() => setFilter('new')} className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${filter === 'new' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}><i className="ri-user-add-line text-sm"></i>New ({filterCounts.new})</button>
        <button onClick={() => setFilter('returning')} className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${filter === 'returning' ? 'border-[#16a34a] text-[#16a34a] bg-green-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}><i className="ri-user-follow-line text-sm"></i>Returning ({filterCounts.returning})</button>
        <button onClick={() => setFilter('high-value')} className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${filter === 'high-value' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}><i className="ri-vip-crown-line text-sm"></i>High Value ({filterCounts.highValue})</button>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="grid grid-cols-5 bg-[#f1f5f9] border border-[#e2e8f0]" style={{ borderRadius: '5px' }}>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Name / Phone</div>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Address</div>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-center text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Last Visit</div>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-center text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Visits / Done</div>
          <div className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Actions</div>
        </div>

        {/* Rows */}
        {filteredCheckouts.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] p-12 text-center" style={{ borderRadius: '5px' }}>
            <i className="ri-shopping-cart-line text-4xl text-gray-300 block mb-3"></i>
            <p className="font-medium text-gray-500">No abandoned checkouts found.</p>
          </div>
        ) : (
          filteredCheckouts.map((ab) => (
            <div key={ab.id} className="flex flex-col">
              {/* Main Row */}
              <div className="grid grid-cols-5 bg-white border border-[#e2e8f0] hover:border-[#94a3b8] transition-all" style={{ borderRadius: '5px' }}>
                {/* Name / Phone */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-green-100 text-green-600 border-2 border-green-200 flex-shrink-0">{getInitials(ab.name)}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1e293b] truncate">{ab.name || 'Unknown'}</p>
                    <p className="text-[11px] text-[#94a3b8]">{ab.phone || 'No phone'}</p>
                  </div>
                </div>
                
                {/* Address */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center">
                  <p className="text-[12px] text-[#64748b] truncate">{ab.address || 'No address'}</p>
                </div>
                
                {/* Last Visit */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[12px] font-medium text-[#1e293b]">{ab.visitTime}</p>
                    <p className="text-[11px] text-[#94a3b8]">{ab.visitDate}</p>
                  </div>
                </div>
                
                {/* Visits / Done */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#1e293b]">{ab.totalVisits}</span>
                    <span className="text-[11px] text-[#94a3b8]">visits</span>
                    <span className="text-[#cbd5e1]">|</span>
                    <span className="text-[13px] font-semibold text-green-600">{ab.completedOrders}</span>
                    <span className="text-[11px] text-[#94a3b8]">done</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="px-4 py-3 flex items-center justify-center gap-1">
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-green-100 hover:text-green-600 transition-all" style={{ borderRadius: '5px' }} onClick={() => window.location.href = `tel:${ab.phone}`}><i className="ri-phone-line text-sm"></i></button>
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-green-100 hover:text-green-600 transition-all" style={{ borderRadius: '5px' }} onClick={() => window.open(`https://wa.me/${(ab.phone || '').replace('+', '')}`, '_blank')}><i className="ri-whatsapp-line text-sm"></i></button>
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all" style={{ borderRadius: '5px' }} onClick={() => { copyToClipboard(ab.phone || '') }}><i className="ri-file-copy-line text-sm"></i></button>
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all" style={{ borderRadius: '5px' }} onClick={() => toggleExpand(ab.id)}>
                    <i className="ri-arrow-down-s-line text-gray-400 transition-transform duration-200" style={{ transform: expandedId === ab.id ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
                  </button>
                </div>
              </div>

              {/* Expand - Dropdown Section */}
              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: expandedId === ab.id ? '2000px' : '0' }}>
                {expandedId === ab.id && (
                  <div className="bg-white border border-gray-300 rounded-[5px] mt-2 overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr className="text-[12px] uppercase text-gray-600 font-bold whitespace-nowrap">
                          <th className="p-4 border-r border-gray-200 w-px">Visit Info</th>
                          <th className="p-4 border-r border-gray-200 w-px">Order Date & Time</th>
                          <th className="p-4 border-r border-gray-200 w-px text-center">Checkout Duration</th>
                          <th className="p-4 border-r border-gray-200">Products</th>
                          <th className="p-4 text-right w-px">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(ab.history || []).map((visit, idx) => {
                          const products = buildProducts(visit.products || [])
                          return (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors whitespace-nowrap align-middle">
                              <td className="p-4 text-[13px] font-bold text-gray-900 border-r border-gray-200">
                                Visit number {idx + 1}
                              </td>
                              <td className="p-4 border-r border-gray-200 text-[13px]">
                                <span className="text-blue-700 font-bold">{visit.timeAgo || '—'}</span>
                                <span className="text-gray-400 mx-1">-</span>
                                <span className="text-gray-700 font-medium">{visit.date}</span>
                                <span className="text-gray-400 mx-1">-</span>
                                <span className="text-gray-600">{visit.time || '—'}</span>
                              </td>
                              <td className="p-4 border-r border-gray-200 text-center text-[13px]">
                                <span className="font-semibold text-orange-600">{formatCheckout(visit.checkoutSeconds)}</span>
                              </td>
                              <td className="p-4 text-[13px] text-gray-800 border-r border-gray-200">
                                <div className="flex items-center">
                                  {products.map((product, index) => (
                                    <div key={index} className="flex items-center">
                                      <div className="px-[5px] py-0.5 flex items-center">
                                        <span className="font-bold text-gray-900 capitalize">{product.name}</span>
                                        <span className="text-gray-500 ml-1">({product.weight}) ({product.count})</span>
                                      </div>
                                      {index !== products.length - 1 && <div className="h-3 border-r border-gray-300 mx-[3px]"></div>}
                                    </div>
                                  ))}
                                  {products.length === 0 && <span className="text-gray-400">—</span>}
                                </div>
                              </td>
                              <td className="p-4 text-[14px] font-black text-gray-900 text-right whitespace-nowrap">
                                TK{roundPrice(visit.total || 0)}
                              </td>
                            </tr>
                          )
                        })}
                        {(ab.history || []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">No visit history</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AbandonedView
