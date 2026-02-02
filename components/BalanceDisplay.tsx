"use client";

import { useEffect, useState } from "react";
import { type LossHistoryEntry } from "../engine";

/**
 * BalanceDisplay - Shows current account balance with loss animations
 * Displays balance in the top bar/HUD with smooth number transitions
 */

interface BalanceDisplayProps {
  balance: number;
  recentLoss: LossHistoryEntry | null;
  showLabel?: boolean;
}

export function BalanceDisplay({
  balance,
  recentLoss,
  showLabel = true,
}: BalanceDisplayProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [showLossNotification, setShowLossNotification] = useState(false);
  const [lossReason, setLossReason] = useState<string | null>(null);
  const [lossAmount, setLossAmount] = useState<number>(0);

  // Animate balance changes
  useEffect(() => {
    const difference = balance - displayBalance;
    const steps = 20;
    const stepSize = difference / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayBalance(balance);
        clearInterval(interval);
      } else {
        setDisplayBalance((prev) => Math.round(prev + stepSize));
      }
    }, 20);

    return () => clearInterval(interval);
  }, [balance]);

  // Show loss notification when a new loss occurs
  useEffect(() => {
    if (recentLoss) {
      setLossAmount(recentLoss.amount);
      setLossReason(recentLoss.reason);
      setShowLossNotification(true);

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setShowLossNotification(false);
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      // Hide notification if no recent loss
      setShowLossNotification(false);
    }
  }, [recentLoss?.sceneId, recentLoss?.amount, recentLoss?.reason]);

  const formatBalance = (amount: number): string => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="balance-display">
      {showLabel && (
        <div className="balance-display__header">
          <span className="balance-display__label">Account Balance</span>
        </div>
      )}
      <div className="balance-display__value-container">
        <span className="balance-display__value">{formatBalance(displayBalance)}</span>
        {showLossNotification && lossReason && (
          <div className="balance-display__loss-notification">
            <span className="balance-display__loss-amount">
              -{formatBalance(lossAmount)}
            </span>
            <span className="balance-display__loss-reason">{lossReason}</span>
          </div>
        )}
      </div>
      <style jsx>{`
        /* ═══ BALANCE DISPLAY - Financial HUD ═══ */
        .balance-display {
          width: 100%;
          padding: 4px 0;
        }
        
        .balance-display__header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 11px;
          font-family: var(--font-mono);
        }
        
        .balance-display__label {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .balance-display__value-container {
          position: relative;
        }
        
        .balance-display__value {
          font-size: 24px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--accent-green);
          text-shadow: 0 0 12px var(--glow-green);
          display: block;
          transition: color 0.3s ease;
        }
        
        /* Loss animation trigger */
        .balance-display__value-container:has(.balance-display__loss-notification) .balance-display__value {
          color: var(--danger-soft);
          text-shadow: 0 0 12px var(--glow-danger);
          animation: balance-shake 0.5s ease;
        }
        
        /* ═══ Loss Notification - Slide in from right ═══ */
        .balance-display__loss-notification {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          padding: 10px 14px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
          border: 1px solid var(--danger-soft);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 200px;
          animation: loss-slide-in 0.4s ease, fade-out 0.3s ease 3.7s;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
          z-index: 10;
        }
        
        .balance-display__loss-amount {
          font-size: 16px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--danger-soft);
          text-shadow: 0 0 8px var(--glow-danger);
        }
        
        .balance-display__loss-reason {
          font-size: 12px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          line-height: 1.4;
        }
        
        /* Animations */
        @keyframes balance-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        @keyframes loss-slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default BalanceDisplay;
