"use client";

/**
 * SystemMessages - Subtle console-style display for delayed feedback
 * Shows system messages that hint at consequences without revealing risk
 */

interface SystemMessagesProps {
  messages: string[];
  maxVisible?: number;
}

export function SystemMessages({
  messages,
  maxVisible = 3,
}: SystemMessagesProps) {
  if (messages.length === 0) return null;

  // Show only the most recent messages
  const visibleMessages = messages.slice(-maxVisible);

  return (
    <div className="system-messages">
      <div className="system-messages__header">
        <span className="system-messages__icon">⚡</span>
        <span className="system-messages__label">System Activity</span>
      </div>
      <ul className="system-messages__list">
        {visibleMessages.map((message, index) => (
          <li key={index} className="system-messages__item">
            <span className="system-messages__prefix">&gt;</span>
            {message}
          </li>
        ))}
      </ul>
      <style jsx>{`
        /* ═══ SYSTEM MESSAGES - Terminal log style ═══ */
        .system-messages {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 14px 16px;
          font-family: var(--font-mono);
          font-size: 12px;
          border: 1px solid var(--border-subtle);
          position: relative;
          overflow: hidden;
          animation: slide-in-right 0.3s ease;
        }
        
        /* Subtle left accent */
        .system-messages::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--warning-amber);
          box-shadow: 0 0 8px rgba(255, 176, 32, 0.4);
        }
        
        .system-messages__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: var(--warning-amber);
        }
        
        .system-messages__icon {
          font-size: 14px;
        }
        
        .system-messages__label {
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 10px;
          font-weight: 600;
        }
        
        /* Blinking indicator */
        .system-messages__label::after {
          content: '_';
          animation: blink 1s step-end infinite;
          margin-left: 2px;
        }
        
        .system-messages__list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .system-messages__item {
          color: var(--warning-amber);
          padding: 5px 0;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.5;
          animation: fade-in 0.3s ease;
        }
        
        .system-messages__prefix {
          color: var(--text-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

export default SystemMessages;
