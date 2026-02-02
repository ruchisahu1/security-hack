"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { SceneOption } from "../engine";

/**
 * SceneRenderer - Displays current scene and choice options
 * Supports timer for time-pressured decisions
 */

/** Timer configuration for time-pressured scenes */
export interface TimerConfig {
  duration: number; // seconds
  defaultOptionIndex: number;
}

export interface SceneData {
  id: number;
  title: string;
  description: string;
  options: SceneOption[];
  imageUrl?: string;
  /** Optional timer for time-pressured decisions */
  timer?: TimerConfig;
  /** Attacker's perspective narration for reveal view */
  attackerNarration?: string;
}

interface SceneRendererProps {
  scene: SceneData | null;
  onChoiceSelect: (option: SceneOption) => void;
  disabled?: boolean;
}

export function SceneRenderer({
  scene,
  onChoiceSelect,
  disabled = false,
}: SceneRendererProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSelectedRef = useRef(false);

  // Memoized handler for auto-select to prevent stale closures
  const handleAutoSelect = useCallback(() => {
    if (!scene || disabled || hasAutoSelectedRef.current) return;

    const defaultIndex = scene.timer?.defaultOptionIndex ?? 0;
    const defaultOption = scene.options[defaultIndex];

    if (defaultOption) {
      hasAutoSelectedRef.current = true;
      onChoiceSelect(defaultOption);
    }
  }, [scene, disabled, onChoiceSelect]);

  // Timer effect - resets on scene change
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset auto-select flag on scene change
    hasAutoSelectedRef.current = false;

    // Initialize timer if scene has one
    if (scene?.timer && !disabled) {
      setTimeRemaining(scene.timer.duration);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Timer expired - auto-select
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // Use setTimeout to avoid state update during render
            setTimeout(handleAutoSelect, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeRemaining(null);
    }

    // Cleanup on unmount or scene change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [scene?.id, scene?.timer, disabled, handleAutoSelect]);

  // Handle manual choice - clear timer
  const handleChoiceClick = (option: SceneOption) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    hasAutoSelectedRef.current = true;
    onChoiceSelect(option);
  };

  if (!scene) {
    return (
      <div className="scene-renderer scene-renderer--loading">
        <p>Loading scene...</p>
        <style jsx>{`
          .scene-renderer--loading {
            padding: 48px;
            text-align: center;
            color: #6b7280;
          }
        `}</style>
      </div>
    );
  }

  const isUrgent = timeRemaining !== null && timeRemaining <= 3;

  return (
    <div className="scene-renderer">
      {/* Timer display */}
      {timeRemaining !== null && (
        <div className={`scene-renderer__timer ${isUrgent ? 'scene-renderer__timer--urgent' : ''}`}>
          <span className="scene-renderer__timer-icon">⏱️</span>
          <span className="scene-renderer__timer-value">{timeRemaining}s</span>
          <span className="scene-renderer__timer-label">remaining</span>
        </div>
      )}

      {scene.imageUrl && (
        <div className="scene-renderer__image-container">
          <img
            src={scene.imageUrl}
            alt={scene.title}
            className="scene-renderer__image"
          />
        </div>
      )}

      <div className="scene-renderer__content">
        <h2 className="scene-renderer__title">{scene.title}</h2>
        <p className="scene-renderer__description">{scene.description}</p>
      </div>

      <div className="scene-renderer__options">
        {scene.options.map((option, index) => (
          <button
            key={option.id}
            className={`scene-renderer__option ${timeRemaining !== null && index === scene.timer?.defaultOptionIndex
              ? 'scene-renderer__option--default'
              : ''
              }`}
            onClick={() => handleChoiceClick(option)}
            disabled={disabled}
          >
            <span className="scene-renderer__option-text">{option.text}</span>
            <span className="scene-renderer__option-label">
              {option.actionLabel}
            </span>
          </button>
        ))}
      </div>

      <style jsx>{`
        /* ═══ SCENE RENDERER - Mission briefing card ═══ */
        .scene-renderer {
          background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          position: relative;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        }
        
        /* Top accent stripe */
        .scene-renderer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
          z-index: 1;
        }
        
        .scene-renderer--loading {
          padding: 48px;
          text-align: center;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        
        /* ═══ Timer - Pressure bar with color shift ═══ */
        .scene-renderer__timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px 20px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
          font-family: var(--font-mono);
          position: relative;
          overflow: hidden;
        }
        
        /* Timer progress bar */
        .scene-renderer__timer::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          background: var(--accent-cyan);
          transform-origin: left;
          transition: transform 1s linear, background-color 0.3s ease;
        }
        
        .scene-renderer__timer--urgent::after {
          background: var(--danger-soft);
          animation: urgency-pulse 0.5s ease-in-out infinite;
        }
        
        .scene-renderer__timer-icon {
          font-size: 18px;
        }
        
        .scene-renderer__timer-value {
          font-weight: 700;
          color: var(--accent-cyan);
          font-size: 24px;
          text-shadow: 0 0 10px var(--glow-cyan);
        }
        
        .scene-renderer__timer--urgent .scene-renderer__timer-value {
          color: var(--danger-soft);
          text-shadow: 0 0 10px var(--glow-danger);
        }
        
        .scene-renderer__timer-label {
          color: var(--text-muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        /* ═══ Image container ═══ */
        .scene-renderer__image-container {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .scene-renderer__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.9;
        }
        
        /* ═══ Content - Terminal/Dossier style ═══ */
        .scene-renderer__content {
          padding: 24px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }
        
        .scene-renderer__title {
          font-size: 18px;
          font-weight: 600;
          color: var(--accent-cyan);
          margin: 0 0 12px 0;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        /* Terminal prompt indicator */
        .scene-renderer__title::before {
          content: '>';
          color: var(--accent-green);
          font-weight: 700;
        }
        
        .scene-renderer__description {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
          font-family: var(--font-mono);
        }
        
        /* ═══ Options - Game-like buttons ═══ */
        .scene-renderer__options {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg-elevated);
        }
        
        .scene-renderer__option {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 18px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }
        
        /* Left accent bar on buttons */
        .scene-renderer__option::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--accent-cyan);
          opacity: 0;
          transition: opacity var(--transition-normal);
        }
        
        .scene-renderer__option:hover:not(:disabled) {
          background: var(--bg-elevated);
          border-color: var(--accent-cyan);
          box-shadow: 0 0 20px var(--glow-cyan), inset 0 0 20px rgba(0, 240, 255, 0.03);
          transform: translateX(4px);
        }
        
        .scene-renderer__option:hover:not(:disabled)::before {
          opacity: 1;
        }
        
        /* Press animation */
        .scene-renderer__option:active:not(:disabled) {
          transform: translateX(4px) scale(0.98);
          transition: transform 0.05s ease;
        }
        
        /* Default option highlight (timer fallback) */
        .scene-renderer__option--default {
          border-color: var(--warning-amber);
          background: rgba(255, 176, 32, 0.05);
        }
        
        .scene-renderer__option--default::before {
          background: var(--warning-amber);
          opacity: 1;
        }
        
        .scene-renderer__option:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        
        .scene-renderer__option-text {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 6px;
          transition: color var(--transition-fast);
        }
        
        .scene-renderer__option:hover:not(:disabled) .scene-renderer__option-text {
          color: var(--accent-cyan);
        }
        
        .scene-renderer__option-label {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

export default SceneRenderer;
