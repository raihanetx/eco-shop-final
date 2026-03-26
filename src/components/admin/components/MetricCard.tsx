'use client'

import React from 'react'

interface MetricCardProps {
  label: string
  value: string
  change?: string
  trend?: 'positive' | 'negative'
  changeLabel?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, trend, changeLabel }) => {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className={`metric-change ${trend === 'positive' ? 'trend-pos' : 'trend-neg'}`}>
          {trend === 'positive' ? '↑' : '↓'} {change} 
          {changeLabel && <span style={{color: 'var(--admin-text-tertiary)', fontWeight: 400}}> {changeLabel}</span>}
        </div>
      )}
    </div>
  )
}

export default MetricCard
