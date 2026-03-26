'use client'

import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/components/admin/context/AdminContext'
import type { AbandonedProduct } from '@/types'
import { roundPrice } from '@/lib/utils'

type CustomerFilter = 'all' | 'new' | 'regular' | 'vip'

const CustomersView: React.FC = () => {
  const { customerProfiles, expandedCustomer, setExpandedCustomer, showToastMsg } = useAdmin()
  const [filter, setFilter] = useState<CustomerFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

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
    showToastMsg('Number copied!')
  }

  const toggleExpand = (id: number) => {
    setExpandedCustomer(expandedCustomer === id ? null : id)
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
    all: customerProfiles.length,
    new: customerProfiles.filter(c => (c.totalOrders || 0) === 1).length,
    regular: customerProfiles.filter(c => (c.totalOrders || 0) >= 2 && (c.totalOrders || 0) <= 5).length,
    vip: customerProfiles.filter(c => (c.totalSpent || 0) >= 1000 || (c.totalOrders || 0) > 5).length,
  }), [customerProfiles])

  // Filter customers
  const filteredByStatus = useMemo(() => {
    if (filter === 'all') return customerProfiles
    if (filter === 'new') return customerProfiles.filter(c => (c.totalOrders || 0) === 1)
    if (filter === 'regular') return customerProfiles.filter(c => (c.totalOrders || 0) >= 2 && (c.totalOrders || 0) <= 5)
    if (filter === 'vip') return customerProfiles.filter(c => (c.totalSpent || 0) >= 1000 || (c.totalOrders || 0) > 5)
    return customerProfiles
  }, [customerProfiles, filter])

  // Search filter
  const filteredCustomers = filteredByStatus.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )

  return (
    <div className="p-4 md:p-8 bg-white min-h-[calc(100vh-80px)]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium transition-all border ${filter === 'all' ? 'border-[#1e293b] text-[#1e293b] bg-[#1e293b]/5' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}>All ({filterCounts.all})</button>
        <button onClick={() => setFilter('new')} className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${filter === 'new' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}><i className="ri-user-add-line text-sm"></i>New ({filterCounts.new})</button>
        <button onClick={() => setFilter('regular')} className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${filter === 'regular' ? 'border-[#16a34a] text-[#16a34a] bg-green-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}><i className="ri-user-heart-line text-sm"></i>Regular ({filterCounts.regular})</button>
        <button onClick={() => setFilter('vip')} className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${filter === 'vip' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`} style={{ borderRadius: '5px' }}><i className="ri-vip-crown-line text-sm"></i>VIP ({filterCounts.vip})</button>
        <div className="flex items-center gap-2 ml-auto border border-gray-300 px-3 py-1.5 focus-within:border-[#16a34a]" style={{ borderRadius: '5px' }}>
          <i className="ri-search-line text-gray-400 text-sm"></i>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-[13px] w-32 md:w-40" />
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="grid grid-cols-5 bg-[#f1f5f9] border border-[#e2e8f0]" style={{ borderRadius: '5px' }}>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Name / Phone</div>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Address</div>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-center text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Orders / Spent</div>
          <div className="px-4 py-3 border-r border-[#e2e8f0] text-center text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Last Order</div>
          <div className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#475569]">Actions</div>
        </div>

        {/* Rows */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] p-12 text-center" style={{ borderRadius: '5px' }}>
            <p className="text-[#94a3b8] text-sm">No customers found.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div key={cust.id} className="flex flex-col">
              {/* Main Row */}
              <div className="grid grid-cols-5 bg-white border border-[#e2e8f0] hover:border-[#94a3b8] transition-all" style={{ borderRadius: '5px' }}>
                {/* Name / Phone */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-purple-100 text-purple-600 border-2 border-purple-200 flex-shrink-0">{getInitials(cust.name)}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1e293b] truncate">{cust.name}</p>
                    <p className="text-[11px] text-[#94a3b8]">{cust.phone}</p>
                  </div>
                </div>
                
                {/* Address */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center">
                  <p className="text-[12px] text-[#64748b] truncate">{cust.address || 'No address'}</p>
                </div>
                
                {/* Orders / Spent */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-[#1e293b]">{cust.totalOrders || 0} orders</p>
                    <p className="text-[11px] text-[#16a34a]">TK {roundPrice(cust.totalSpent || 0)}</p>
                  </div>
                </div>
                
                {/* Last Order */}
                <div className="px-4 py-3 border-r border-[#e2e8f0] flex items-center justify-center">
                  <span className="text-[12px] text-[#6b7280]">{cust.lastOrderAgo || cust.lastVisit || '-'}</span>
                </div>
                
                {/* Actions */}
                <div className="px-4 py-3 flex items-center justify-center gap-1">
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-green-100 hover:text-green-600 transition-all" style={{ borderRadius: '5px' }} onClick={() => window.location.href = `tel:${cust.phone}`}><i className="ri-phone-line text-sm"></i></button>
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-green-100 hover:text-green-600 transition-all" style={{ borderRadius: '5px' }} onClick={() => window.open(`https://wa.me/${cust.phone.replace('+', '')}`, '_blank')}><i className="ri-whatsapp-line text-sm"></i></button>
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all" style={{ borderRadius: '5px' }} onClick={() => copyToClipboard(cust.phone)}><i className="ri-file-copy-line text-sm"></i></button>
                  <button className="act-btn w-7 h-7 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all" style={{ borderRadius: '5px' }} onClick={() => toggleExpand(cust.id)}>
                    <i className="ri-arrow-down-s-line text-gray-400 transition-transform duration-200" style={{ transform: expandedCustomer === cust.id ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
                  </button>
                </div>
              </div>

              {/* Expand - Dropdown Section */}
              {expandedCustomer === cust.id && (
                <div className="bg-white border border-gray-300 rounded-[5px] mt-2 overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr className="text-[12px] uppercase text-gray-600 font-bold whitespace-nowrap">
                        <th className="p-4 border-r border-gray-200 w-px">Visit Info</th>
                        <th className="p-4 border-r border-gray-200 w-px">Order Date & Time</th>
                        <th className="p-4 border-r border-gray-200 w-px text-center">Payment Method</th>
                        <th className="p-4 border-r border-gray-200">Products</th>
                        <th className="p-4 text-right w-px">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(cust.orders || []).map((visit, idx) => {
                        const products = buildProducts(visit.products || [])
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors whitespace-nowrap align-middle">
                            <td className="p-4 text-[13px] font-bold text-gray-900 border-r border-gray-200">
                              Visit number {idx + 1}
                            </td>
                            <td className="p-4 border-r border-gray-200 text-[13px]">
                              <span className="text-blue-700 font-bold">{visit.relativeTime || '—'}</span>
                              <span className="text-gray-400 mx-1">-</span>
                              <span className="text-gray-700 font-medium">{visit.date}</span>
                              <span className="text-gray-400 mx-1">-</span>
                              <span className="text-gray-600">{visit.time || '—'}</span>
                            </td>
                            <td className="p-4 border-r border-gray-200 text-center text-[13px]">
                              <span className="font-semibold text-green-600">{visit.paymentMethod || 'Cash on Delivery'}</span>
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
                      {(cust.orders || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">No order history</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CustomersView
