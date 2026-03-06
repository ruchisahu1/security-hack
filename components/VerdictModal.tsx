"use client";

import type { Verdict } from "../engine";

/**
 * VerdictModal - Displays game outcome and verdict
 * Shows grade, explanation, and prevention tips.
 * When recoveryOutcome is present, shows Final Summary: incident, response analysis, recovery effectiveness, advice.
 */

interface VerdictModalProps {
  verdict: Verdict;
  isOpen: boolean;
  onClose?: () => void;
  onReplay?: () => void;
  onHome?: () => void;
}

export function VerdictModal({
  verdict,
  isOpen,
  onClose,
  onReplay,
  onHome,
}: VerdictModalProps) {
  if (!isOpen) return null;

  const hasRecoveryOutcome = Boolean(verdict.recoveryOutcome);
  const ro = verdict.recoveryOutcome;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "S":
        return "#8b5cf6"; // purple
      case "A":
        return "#22c55e"; // green
      case "B":
        return "#3b82f6"; // blue
      case "C":
        return "#eab308"; // yellow
      case "D":
        return "#f97316"; // orange
      case "F":
        return "#ef4444"; // red
      default:
        return "#6b7280";
    }
  };

  const getRecoveryOutcomeColor = (type: string) => {
    switch (type) {
      case "fully_safe":
        return "#22c55e";
      case "partially_recovered":
        return "#3b82f6";
      case "damage_contained":
        return "#eab308";
      case "severe_loss":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="verdict-modal__overlay">
      <div className="verdict-modal">
        <div className="verdict-modal__header">
          <div
            className="verdict-modal__grade"
            style={{
              backgroundColor: hasRecoveryOutcome && ro
                ? getRecoveryOutcomeColor(ro.type)
                : getGradeColor(verdict.grade),
            }}
          >
            {hasRecoveryOutcome && ro
              ? (ro.type === "fully_safe"
                  ? "Safe"
                  : ro.type === "partially_recovered"
                    ? "Partial"
                    : ro.type === "damage_contained"
                      ? "Contained"
                      : "Severe")
              : verdict.grade}
          </div>
          <h2 className="verdict-modal__title">{verdict.title}</h2>
          <div className="verdict-modal__score">
            Score: {verdict.score} / {verdict.maxScore}
            {hasRecoveryOutcome && ro && (
              <span className="verdict-modal__recovery-stats">
                {" "}
                · Lost ₹{ro.totalLost} · Recovered ₹{ro.moneyRecovered} · Net ₹{ro.netLoss}
              </span>
            )}
          </div>
        </div>

        <div className="verdict-modal__body">
          <p className="verdict-modal__explanation">{verdict.explanationText}</p>

          {hasRecoveryOutcome && ro && (
            <>
              <div className="verdict-modal__summary-section">
                <h3 className="verdict-modal__tips-title">Incident Summary</h3>
                <ul className="verdict-modal__tips-list">
                  {ro.incidentSummary.map((line, index) => (
                    <li key={index} className="verdict-modal__tip">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="verdict-modal__summary-section">
                <h3 className="verdict-modal__tips-title">Your Response</h3>
                <ul className="verdict-modal__tips-list">
                  {ro.responseAnalysis.map((line, index) => (
                    <li key={index} className="verdict-modal__tip">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="verdict-modal__summary-section verdict-modal__recovery-effectiveness">
                <span>Response speed: </span>
                <span>{Math.round(ro.responseSpeedScore * 100)}%</span>
                <span> · Threats remaining: {ro.threatsRemaining}</span>
              </div>
            </>
          )}

          {verdict.preventionTips.length > 0 && (
            <div className="verdict-modal__tips">
              <h3 className="verdict-modal__tips-title">
                {hasRecoveryOutcome ? "Practical advice" : "Prevention Tips"}
              </h3>
              <ul className="verdict-modal__tips-list">
                {verdict.preventionTips.map((tip, index) => (
                  <li key={index} className="verdict-modal__tip">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {verdict.skillSummary && verdict.skillSummary.feedback.length > 0 && (
            <div className="verdict-modal__skills">
              <h3 className="verdict-modal__skills-title">Your Progress</h3>
              <ul className="verdict-modal__skills-list">
                {verdict.skillSummary.feedback.map((line, index) => (
                  <li key={index} className="verdict-modal__skill-item">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>


        <div className="verdict-modal__footer">
          {onReplay && (
            <button
              className="verdict-modal__button verdict-modal__button--primary"
              onClick={onReplay}
            >
              Play Again
            </button>
          )}
          {onClose && (
            <button
              className="verdict-modal__button verdict-modal__button--secondary"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
      <style jsx>{`
        /* ═══ VERDICT MODAL - Strong headline styling ═══ */
        .verdict-modal__overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
          animation: fade-in 0.3s ease;
        }
        
        .verdict-modal {
          background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
          border-radius: 16px;
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border-subtle);
          box-shadow: 0 0 60px rgba(0, 0, 0, 0.5), 0 0 30px var(--glow-cyan);
          position: relative;
        }
        
        /* Top accent bar */
        .verdict-modal::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
          border-radius: 16px 16px 0 0;
        }
        
        .verdict-modal__header {
          text-align: center;
          padding: 32px 24px 20px;
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .verdict-modal__grade {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          color: var(--bg-primary);
          font-size: 36px;
          font-weight: 700;
          font-family: var(--font-mono);
          margin-bottom: 16px;
          box-shadow: 0 0 30px currentColor;
        }
        
        .verdict-modal__title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 10px 0;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .verdict-modal__score {
          font-size: 14px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        
        .verdict-modal__recovery-stats {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .verdict-modal__summary-section {
          background: var(--bg-elevated);
          border-radius: 10px;
          padding: 18px;
          border: 1px solid var(--border-subtle);
          margin-bottom: 16px;
        }
        
        .verdict-modal__recovery-effectiveness {
          font-size: 13px;
          color: var(--text-secondary);
        }
        
        .verdict-modal__body {
          padding: 24px;
        }
        
        .verdict-modal__explanation {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0 0 24px 0;
        }
        
        .verdict-modal__tips {
          background: var(--bg-elevated);
          border-radius: 10px;
          padding: 18px;
          border: 1px solid var(--border-subtle);
        }
        
        .verdict-modal__tips-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-green);
          margin: 0 0 14px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-mono);
        }
        
        .verdict-modal__tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .verdict-modal__tip {
          font-size: 13px;
          color: var(--text-secondary);
          padding: 8px 0 8px 20px;
          position: relative;
          line-height: 1.5;
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .verdict-modal__tip:last-child {
          border-bottom: none;
        }
        
        .verdict-modal__tip::before {
          content: '▸';
          position: absolute;
          left: 0;
          color: var(--accent-cyan);
        }
        
        .verdict-modal__skills {
          background: var(--bg-elevated);
          border-radius: 10px;
          padding: 18px;
          border: 1px solid var(--border-subtle);
          margin-top: 16px;
        }
        
        .verdict-modal__skills-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-cyan);
          margin: 0 0 14px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-mono);
        }
        
        .verdict-modal__skills-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .verdict-modal__skill-item {
          font-size: 13px;
          color: var(--text-secondary);
          padding: 8px 0 8px 20px;
          position: relative;
          line-height: 1.5;
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .verdict-modal__skill-item:last-child {
          border-bottom: none;
        }
        
        .verdict-modal__skill-item::before {
          content: '◆';
          position: absolute;
          left: 0;
          color: var(--accent-green);
          font-size: 10px;
        }
        
        .verdict-modal__footer {
          display: flex;
          gap: 12px;
          padding: 20px 24px 28px;
          justify-content: center;
        }
        
        .verdict-modal__button {
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all var(--transition-normal);
        }
        
        .verdict-modal__button--primary {
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-cyan-dim));
          color: var(--bg-primary);
          box-shadow: 0 0 20px var(--glow-cyan);
        }
        
        .verdict-modal__button--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px var(--glow-cyan), 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .verdict-modal__button--primary:active {
          transform: translateY(0);
        }
        
        .verdict-modal__button--secondary {
          background: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }
        
        .verdict-modal__button--secondary:hover {
          background: var(--bg-card);
          border-color: var(--text-muted);
          color: var(--text-primary);
        }
        .verdict-modal__button--home {
          background: linear-gradient(135deg, #facc15, #eab308);
          color: #111;
          box-shadow: 0 0 15px rgba(250, 204, 21, 0.5);
        }
        
        .verdict-modal__button--home:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(250, 204, 21, 0.7);
        }
      `}</style>
    </div>
  );
}

export default VerdictModal;
