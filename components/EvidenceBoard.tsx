"use client";

import type { EvidenceItem } from "../engine";

/**
 * EvidenceBoard - Displays collected evidence items
 * Renders a list/grid of evidence the player has gathered
 */

interface EvidenceBoardProps {
  evidence: EvidenceItem[];
  onEvidenceClick?: (evidence: EvidenceItem) => void;
  emptyMessage?: string;
}

export function EvidenceBoard({
  evidence,
  onEvidenceClick,
  emptyMessage = "No evidence collected yet",
}: EvidenceBoardProps) {
  if (evidence.length === 0) {
    return (
      <div className="evidence-board evidence-board--empty">
        <p className="evidence-board__empty-message">{emptyMessage}</p>
        <style jsx>{`
          .evidence-board--empty {
            padding: 24px;
            text-align: center;
            background-color: #f9fafb;
            border-radius: 8px;
            border: 1px dashed #d1d5db;
          }
          .evidence-board__empty-message {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="evidence-board">
      <h3 className="evidence-board__title">
        Evidence Collected ({evidence.length})
      </h3>
      <ul className="evidence-board__list">
        {evidence.map((item) => (
          <li
            key={item.id}
            className="evidence-board__item"
            onClick={() => onEvidenceClick?.(item)}
            role={onEvidenceClick ? "button" : undefined}
            tabIndex={onEvidenceClick ? 0 : undefined}
          >
            <div className="evidence-board__item-header">
              <span className="evidence-board__item-title">{item.title}</span>
              <span className="evidence-board__item-category">
                {item.category}
              </span>
            </div>
            <p className="evidence-board__item-description">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
      <style jsx>{`
        /* ═══ EVIDENCE BOARD - Digital dashboard ═══ */
        .evidence-board {
          padding: 20px;
          background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
          position: relative;
        }
        
        /* Top accent */
        .evidence-board::before {
          content: '';
          position: absolute;
          top: 0;
          left: 20px;
          right: 20px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
        }
        
        .evidence-board--empty {
          padding: 32px;
          text-align: center;
          background: var(--bg-elevated);
          border-radius: 10px;
          border: 1px dashed var(--border-glow);
        }
        
        .evidence-board__empty-message {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0;
          font-family: var(--font-mono);
        }
        
        .evidence-board__title {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-cyan);
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        /* Icon before title */
        .evidence-board__title::before {
          content: '◆';
          font-size: 8px;
        }
        
        .evidence-board__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        /* ═══ Evidence cards - Collectible feel ═══ */
        .evidence-board__item {
          padding: 14px;
          background: var(--bg-secondary);
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          cursor: ${onEvidenceClick ? "pointer" : "default"};
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }
        
        /* Left glow bar */
        .evidence-board__item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--accent-green);
          box-shadow: 0 0 8px var(--glow-green);
        }
        
        .evidence-board__item:hover {
          background: ${onEvidenceClick ? "var(--bg-elevated)" : "var(--bg-secondary)"};
          border-color: ${onEvidenceClick ? "var(--accent-green)" : "var(--border-subtle)"};
          transform: ${onEvidenceClick ? "translateX(3px)" : "none"};
        }
        
        .evidence-board__item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        
        .evidence-board__item-title {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 13px;
        }
        
        .evidence-board__item-category {
          font-size: 9px;
          color: var(--accent-cyan);
          background: rgba(0, 240, 255, 0.1);
          padding: 3px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: var(--font-mono);
          border: 1px solid rgba(0, 240, 255, 0.2);
        }
        
        .evidence-board__item-description {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

export default EvidenceBoard;
