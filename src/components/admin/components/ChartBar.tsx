'use client'

import React from 'react'

interface ChartBarProps {
  day: string
  height: string
  active?: boolean
}

const ChartBar: React.FC<ChartBarProps> = ({ day, height, active }) => {
  return (
    <div className="bar-group">
      <div className={`bar ${active ? 'active' : ''}`} style={{height}}></div>
      <span className="bar-label">{day}</span>
    </div>
  )
}

export default ChartBar
