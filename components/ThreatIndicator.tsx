"use client";

/**
 * ThreatIndicator - Non-intrusive display of active security threats
 * Shows count of unresolved threats without exposing details
 */

interface ThreatIndicatorProps {
  activeThreatCount: number;
}

export function ThreatIndicator({ activeThreatCount }: ThreatIndicatorProps) {
  if (activeThreatCount === 0) {
    return null;
  }

  return (
    <div className="threat-indicator">
      <span className="threat-indicator__icon">⚠️</span>
      <span className="threat-indicator__text">
        Active Security Threats: {activeThreatCount}
      </span>
      <style jsx>{`
        /* ═══ THREAT INDICATOR - Subtle warning display ═══ */
        .threat-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255, 176, 32, 0.1);
          border: 1px solid var(--warning-amber);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--warning-amber);
          animation: fade-in 0.3s ease;
        }
        
        .threat-indicator__icon {
          font-size: 14px;
          filter: drop-shadow(0 0 4px var(--warning-amber));
        }
        
        .threat-indicator__text {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Subtle pulse animation for attention */
        @keyframes threat-pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(255, 176, 32, 0.4);
          }
          50% {
            opacity: 0.9;
            box-shadow: 0 0 8px 2px rgba(255, 176, 32, 0.2);
          }
        }
        
        .threat-indicator {
          animation: fade-in 0.3s ease, threat-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default ThreatIndicator;
