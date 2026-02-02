"use client";

import type { SceneData } from "./SceneRenderer";

/**
 * RevealView - Split-screen view showing player vs attacker perspective
 * Displays after verdict to show what happened behind the scenes
 */

interface RevealViewProps {
  /** Player's actions taken during the game */
  actionsTaken: string[];
  /** All scenes with their attacker narrations */
  scenes: SceneData[];
  /** IDs of scenes the player visited (derived from actions/narrations) */
  visitedSceneIds: number[];
  onClose?: () => void;
}

export function RevealView({
  actionsTaken,
  scenes,
  visitedSceneIds,
  onClose,
}: RevealViewProps) {
  // Get attacker narrations for visited scenes
  const attackerTimeline = visitedSceneIds
    .map((sceneId) => {
      const scene = scenes.find((s) => s.id === sceneId);
      return scene?.attackerNarration
        ? { sceneTitle: scene.title, narration: scene.attackerNarration }
        : null;
    })
    .filter((item): item is { sceneTitle: string; narration: string } => item !== null);

  return (
    <div className="reveal-view">
      <div className="reveal-view__header">
        <h2 className="reveal-view__title">🔍 Behind The Scenes</h2>
        <p className="reveal-view__subtitle">
          See what was happening while you made your choices
        </p>
      </div>

      <div className="reveal-view__columns">
        {/* Player Timeline */}
        <div className="reveal-view__column reveal-view__column--player">
          <div className="reveal-view__column-header">
            <span className="reveal-view__column-icon">👤</span>
            <h3 className="reveal-view__column-title">Your Actions</h3>
          </div>
          <ul className="reveal-view__timeline">
            {actionsTaken.map((action, index) => (
              <li key={index} className="reveal-view__timeline-item">
                <span className="reveal-view__timeline-number">{index + 1}</span>
                <span className="reveal-view__timeline-text">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Attacker Timeline */}
        <div className="reveal-view__column reveal-view__column--attacker">
          <div className="reveal-view__column-header">
            <span className="reveal-view__column-icon">🕵️</span>
            <h3 className="reveal-view__column-title">Attacker's View</h3>
          </div>
          {attackerTimeline.length > 0 ? (
            <ul className="reveal-view__timeline">
              {attackerTimeline.map((item, index) => (
                <li key={index} className="reveal-view__timeline-item reveal-view__timeline-item--attacker">
                  <span className="reveal-view__timeline-number">{index + 1}</span>
                  <div className="reveal-view__timeline-content">
                    <span className="reveal-view__timeline-scene">{item.sceneTitle}</span>
                    <span className="reveal-view__timeline-text">{item.narration}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="reveal-view__no-data">
              No attacker activity detected — your safe choices prevented exposure.
            </p>
          )}
        </div>
      </div>

      {onClose && (
        <div className="reveal-view__footer">
          <button className="reveal-view__close-btn" onClick={onClose}>
            Continue to Results
          </button>
        </div>
      )}

      <style jsx>{`
        /* ═══ REVEAL VIEW - Split-screen comparison ═══ */
        .reveal-view {
          background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
          border-radius: 14px;
          padding: 28px;
          color: var(--text-primary);
          border: 1px solid var(--border-subtle);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        }
        
        .reveal-view__header {
          text-align: center;
          margin-bottom: 28px;
        }
        
        .reveal-view__title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 10px 0;
          font-family: var(--font-mono);
          color: var(--text-primary);
        }
        
        .reveal-view__subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
        }
        
        .reveal-view__columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .reveal-view__column {
          background: var(--bg-elevated);
          border-radius: 10px;
          padding: 18px;
          border: 1px solid var(--border-subtle);
        }
        
        .reveal-view__column--player {
          border-left: 3px solid var(--accent-cyan);
        }
        
        .reveal-view__column--attacker {
          border-left: 3px solid var(--danger-soft);
        }
        
        .reveal-view__column-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }
        
        .reveal-view__column-icon {
          font-size: 22px;
        }
        
        .reveal-view__column-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-mono);
        }
        
        .reveal-view__timeline {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .reveal-view__timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-subtle);
          animation: fade-in 0.3s ease;
          animation-fill-mode: both;
        }
        
        .reveal-view__timeline-item:nth-child(1) { animation-delay: 0.1s; }
        .reveal-view__timeline-item:nth-child(2) { animation-delay: 0.2s; }
        .reveal-view__timeline-item:nth-child(3) { animation-delay: 0.3s; }
        .reveal-view__timeline-item:nth-child(4) { animation-delay: 0.4s; }
        .reveal-view__timeline-item:nth-child(5) { animation-delay: 0.5s; }
        
        .reveal-view__timeline-item:last-child {
          border-bottom: none;
        }
        
        .reveal-view__timeline-number {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          background: var(--bg-card);
          border: 1px solid var(--border-glow);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }
        
        .reveal-view__column--player .reveal-view__timeline-number {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }
        
        .reveal-view__column--attacker .reveal-view__timeline-number {
          background: rgba(255, 90, 90, 0.1);
          border-color: var(--danger-soft);
          color: var(--danger-soft);
        }
        
        .reveal-view__timeline-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .reveal-view__timeline-scene {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: var(--font-mono);
        }
        
        .reveal-view__timeline-text {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        
        .reveal-view__timeline-item--attacker .reveal-view__timeline-text {
          color: var(--danger-soft);
        }
        
        .reveal-view__no-data {
          font-size: 14px;
          color: var(--text-muted);
          text-align: center;
          padding: 28px;
          font-style: italic;
        }
        
        .reveal-view__footer {
          margin-top: 28px;
          text-align: center;
        }
        
        .reveal-view__close-btn {
          padding: 14px 36px;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-cyan-dim));
          color: var(--bg-primary);
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all var(--transition-normal);
          box-shadow: 0 0 20px var(--glow-cyan);
        }
        
        .reveal-view__close-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 30px var(--glow-cyan), 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .reveal-view__close-btn:active {
          transform: translateY(0);
        }
        
        @media (max-width: 640px) {
          .reveal-view__columns {
            grid-template-columns: 1fr;
          }
          .reveal-view {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default RevealView;
