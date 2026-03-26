'use client'

import React from 'react'

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'canceled' | 'active' | 'inactive' | 'hidden'
  type?: 'order' | 'product' | 'category'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  // Order status badges
  if (type === 'order') {
    if (status === 'pending') {
      return (
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#fef3c7', color: '#d97706'}}>
          <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#d97706'}}></span>
          Pending
        </span>
      )
    }
    if (status === 'approved') {
      return (
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#d1fae5', color: '#16a34a'}}>
          <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a'}}></span>
          Approved
        </span>
      )
    }
    if (status === 'canceled') {
      return (
        <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#fee2e2', color: '#dc2626'}}>
          <span style={{width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626'}}></span>
          Canceled
        </span>
      )
    }
  }

  // Category status badges
  if (type === 'category') {
    if (status === 'active') {
      return <span className="status-bracket active">[Active]</span>
    }
    return <span className="status-bracket hidden-status">[Hidden]</span>
  }

  return null
}

export default StatusBadge
