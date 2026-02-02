"use client";

/**
 * RiskMeter - Visual indicator of current risk level
 * Displays a subtle progress bar showing accumulated risk
 */

interface RiskMeterProps {
  riskScore: number;
  maxRisk?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
}

export function RiskMeter({
  riskScore,
  maxRisk = 100,
  showLabel = true,
  showPercentage = false,
}: RiskMeterProps) {
  const percentage = Math.min(100, (riskScore / maxRisk) * 100);

  const getRiskColor = () => {
    if (percentage <= 25) return "#22c55e"; // green
    if (percentage <= 50) return "#eab308"; // yellow
    if (percentage <= 75) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const getRiskLevel = () => {
    if (percentage <= 25) return "Low";
    if (percentage <= 50) return "Moderate";
    if (percentage <= 75) return "High";
    return "Critical";
  };

  return (
    <div className="risk-meter">
      {showLabel && (
        <div className="risk-meter__header">
          <span className="risk-meter__label">Risk Level</span>
          <span
            className="risk-meter__level"
            style={{ color: getRiskColor() }}
          >
            {getRiskLevel()}
            {showPercentage && ` (${Math.round(percentage)}%)`}
          </span>
        </div>
      )}
      <div className="risk-meter__track">
        <div
          className="risk-meter__fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getRiskColor(),
          }}
        />
      </div>
      <style jsx>{`
        /* ═══ RISK METER - Animated bar with glow ═══ */
        .risk-meter {
          width: 100%;
          padding: 4px 0;
        }
        
        .risk-meter__header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 11px;
          font-family: var(--font-mono);
        }
        
        .risk-meter__label {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .risk-meter__level {
          font-weight: 600;
          text-shadow: 0 0 8px currentColor;
        }
        
        .risk-meter__track {
          width: 100%;
          height: 8px;
          background: var(--bg-secondary);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
        }
        
        .risk-meter__fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease, background-color 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </div>
  );
}

export default RiskMeter;
