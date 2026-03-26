'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SpinWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onWin: (prize: string, discount: number) => void;
}

const PRIZES = [
  { label: '5% OFF', discount: 5, color: '#FF6B6B' },
  { label: 'Try Again', discount: 0, color: '#4ECDC4' },
  { label: '10% OFF', discount: 10, color: '#45B7D1' },
  { label: 'Free Ship', discount: 0, color: '#96CEB4', isFreeShipping: true },
  { label: '15% OFF', discount: 15, color: '#FFEAA7' },
  { label: 'Try Again', discount: 0, color: '#DDA0DD' },
  { label: '20% OFF', discount: 20, color: '#98D8C8' },
  { label: 'Tk 50', discount: 50, color: '#F7DC6F', isCash: true },
];

export default function SpinWheel({ isOpen, onClose, onWin }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ prize: string; discount: number } | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Ref for setTimeout cleanup (prevent memory leaks)
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const spinWheel = useCallback(() => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);
    setShowResult(false);

    // Random spin between 5-10 full rotations plus random position
    const spins = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + extraDegrees;

    setRotation(totalRotation);

    // Calculate winning segment (with cleanup to prevent memory leaks)
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }
    spinTimeoutRef.current = setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      // Each segment is 45 degrees (360/8)
      const segmentSize = 360 / PRIZES.length;
      // Calculate which segment is at the top pointer
      const winningIndex = Math.floor((360 - normalizedRotation + segmentSize / 2) % 360 / segmentSize);
      const winner = PRIZES[winningIndex];

      setResult({ prize: winner.label, discount: winner.discount });
      setShowResult(true);
      setSpinning(false);

      if (winner.discount > 0 || winner.isFreeShipping || winner.isCash) {
        onWin(winner.label, winner.discount);
      }
    }, 5000);
  }, [spinning, rotation, onWin]);

  if (!isOpen) return null;

  return (
    <div className="spinwheel-overlay" onClick={onClose}>
      <div className="spinwheel-modal" onClick={(e) => e.stopPropagation()}>
        <button className="spinwheel-close" onClick={onClose}>
          <i className="ri-close-line"></i>
        </button>

        <h2 className="spinwheel-title">🎉 Spin & Win!</h2>
        <p className="spinwheel-subtitle">Try your luck for amazing discounts!</p>

        <div className="spinwheel-container">
          {/* Pointer */}
          <div className="spinwheel-pointer"></div>

          {/* Wheel */}
          <div
            className="spinwheel-wheel"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
            }}
          >
            {PRIZES.map((prize, index) => {
              const angle = (360 / PRIZES.length) * index;
              const skewAngle = 90 - (360 / PRIZES.length);
              return (
                <div
                  key={index}
                  className="spinwheel-segment"
                  style={{
                    transform: `rotate(${angle}deg) skewY(-${skewAngle}deg)`,
                    background: prize.color
                  }}
                >
                  <span
                    className="spinwheel-segment-text"
                    style={{ transform: `skewY(${skewAngle}deg) rotate(${(360 / PRIZES.length) / 2}deg)` }}
                  >
                    {prize.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Center button */}
          <button
            className="spinwheel-center-btn"
            onClick={spinWheel}
            disabled={spinning}
          >
            {spinning ? '🎰' : 'SPIN'}
          </button>
        </div>

        {/* Result popup */}
        {showResult && result && (
          <div className="spinwheel-result">
            {result.discount > 0 ? (
              <>
                <div className="spinwheel-result-icon">🎊</div>
                <div className="spinwheel-result-text">
                  Congratulations! You won <strong>{result.prize}</strong>!
                </div>
              </>
            ) : (
              <>
                <div className="spinwheel-result-icon">😔</div>
                <div className="spinwheel-result-text">
                  Better luck next time!
                </div>
              </>
            )}
            <button className="spinwheel-result-btn" onClick={onClose}>
              {result.discount > 0 ? 'Claim Prize' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating trigger button component
export function SpinWheelTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button className="spinwheel-trigger" onClick={onClick}>
      <span className="spinwheel-trigger-icon">🎡</span>
      <span className="spinwheel-trigger-text">Spin to Win!</span>
    </button>
  );
}
