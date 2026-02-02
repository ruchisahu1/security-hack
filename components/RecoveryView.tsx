"use client";

import type { GameState } from "../engine";
import {
    getAvailableRecoveryActions,
    getTotalMoneyLost,
    getActiveThreatCount,
    type RecoveryActionDef,
    type RecoverySnapshot,
} from "../engine";

interface RecoveryViewProps {
    gameState: GameState;
    snapshot: RecoverySnapshot;
    usedActionIds: string[];
    moneyRecoveredSoFar: number;
    totalRecoveryTurns: number;
    lastResultMessage: string | null;
    onActionSelect: (actionId: string) => void;
    onProceedToSummary: () => void;
}

/**
 * RecoveryView - Recovery Mode UI
 * Lets players take realistic recovery actions after a cyber incident.
 */
export function RecoveryView({
    gameState,
    snapshot,
    usedActionIds,
    moneyRecoveredSoFar,
    totalRecoveryTurns,
    lastResultMessage,
    onActionSelect,
    onProceedToSummary,
}: RecoveryViewProps) {
    const totalLost = snapshot.totalMoneyLost;
    const availableActions = getAvailableRecoveryActions(gameState, usedActionIds);
    const activeThreats = getActiveThreatCount(gameState);

    return (
        <div className="recovery-view">
            <div className="recovery-view__header">
                <h2 className="recovery-view__title">Recovery Mode</h2>
                <p className="recovery-view__subtitle">
                    A cyber incident occurred. Take action to recover money and secure your accounts.
                </p>
            </div>

            <div className="recovery-view__incident">
                <h3 className="recovery-view__section-title">Incident snapshot</h3>
                <ul className="recovery-view__incident-list">
                    <li>Balance at incident: ₹{snapshot.balanceAtIncident}</li>
                    <li>Total money lost: ₹{totalLost}</li>
                    <li>Active threats at incident: {snapshot.activeThreatsAtIncident.length}</li>
                    <li>Current balance: ₹{gameState.balance}</li>
                    <li>Recovered so far: ₹{moneyRecoveredSoFar}</li>
                    <li>Threats remaining: {activeThreats}</li>
                </ul>
            </div>

            {lastResultMessage && (
                <div className="recovery-view__last-result">
                    <span className="recovery-view__last-result-label">Last action:</span>{" "}
                    {lastResultMessage}
                </div>
            )}

            <div className="recovery-view__actions">
                <h3 className="recovery-view__section-title">Recovery actions</h3>
                <p className="recovery-view__actions-hint">
                    Choose actions to recover money and resolve threats. Each action has a time cost.
                </p>
                <div className="recovery-view__actions-grid">
                    {availableActions.map((action) => (
                        <RecoveryActionCard
                            key={action.id}
                            action={action}
                            onSelect={() => onActionSelect(action.id)}
                        />
                    ))}
                </div>
                {usedActionIds.length > 0 && (
                    <p className="recovery-view__actions-taken">
                        Actions taken: {snapshot.actionsTakenInRecovery.join(" → ")}
                    </p>
                )}
            </div>

            <div className="recovery-view__footer">
                <button
                    type="button"
                    className="recovery-view__button recovery-view__button--primary"
                    onClick={onProceedToSummary}
                >
                    Proceed to summary
                </button>
                <p className="recovery-view__footer-hint">
                    You can take more actions or proceed now. Your response will be analyzed in the final summary.
                </p>
            </div>

            <style jsx>{`
                .recovery-view {
                    max-width: 640px;
                    margin: 0 auto;
                    padding: 24px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    animation: fade-in 0.4s ease;
                }
                .recovery-view__header {
                    margin-bottom: 24px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .recovery-view__title {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--accent-cyan);
                    margin: 0 0 8px 0;
                    font-family: var(--font-mono);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .recovery-view__subtitle {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 0;
                    line-height: 1.5;
                }
                .recovery-view__section-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin: 0 0 12px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-family: var(--font-mono);
                }
                .recovery-view__incident {
                    margin-bottom: 20px;
                }
                .recovery-view__incident-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-secondary);
                }
                .recovery-view__incident-list li {
                    padding: 6px 0;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .recovery-view__incident-list li:last-child {
                    border-bottom: none;
                }
                .recovery-view__last-result {
                    margin-bottom: 20px;
                    padding: 12px 16px;
                    background: var(--bg-card);
                    border-radius: 8px;
                    border-left: 3px solid var(--accent-green);
                    font-size: 13px;
                    color: var(--text-secondary);
                }
                .recovery-view__last-result-label {
                    color: var(--text-muted);
                    font-weight: 600;
                }
                .recovery-view__actions {
                    margin-bottom: 24px;
                }
                .recovery-view__actions-hint {
                    font-size: 13px;
                    color: var(--text-muted);
                    margin: 0 0 16px 0;
                }
                .recovery-view__actions-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .recovery-view__actions-taken {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin: 14px 0 0 0;
                }
                .recovery-view__footer {
                    padding-top: 20px;
                    border-top: 1px solid var(--border-subtle);
                }
                .recovery-view__button {
                    padding: 14px 28px;
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
                .recovery-view__button--primary {
                    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-cyan-dim));
                    color: var(--bg-primary);
                    box-shadow: 0 0 20px var(--glow-cyan);
                }
                .recovery-view__button--primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 0 30px var(--glow-cyan);
                }
                .recovery-view__footer-hint {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin: 12px 0 0 0;
                }
            `}</style>
        </div>
    );
}

function RecoveryActionCard({
    action,
    onSelect,
}: {
    action: RecoveryActionDef;
    onSelect: () => void;
}) {
    return (
        <div className="recovery-action-card">
            <div className="recovery-action-card__content">
                <h4 className="recovery-action-card__label">{action.label}</h4>
                <p className="recovery-action-card__desc">{action.description}</p>
                <div className="recovery-action-card__meta">
                    <span>Effectiveness: {Math.round(action.effectiveness * 100)}%</span>
                    <span>Time cost: {action.timeCost}</span>
                </div>
            </div>
            <button
                type="button"
                className="recovery-action-card__button"
                onClick={onSelect}
            >
                Do this
            </button>
            <style jsx>{`
                .recovery-action-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 16px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: 10px;
                }
                .recovery-action-card__content {
                    flex: 1;
                    min-width: 0;
                }
                .recovery-action-card__label {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 6px 0;
                }
                .recovery-action-card__desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin: 0 0 8px 0;
                    line-height: 1.4;
                }
                .recovery-action-card__meta {
                    font-size: 11px;
                    color: var(--text-muted);
                }
                .recovery-action-card__meta span + span {
                    margin-left: 12px;
                }
                .recovery-action-card__button {
                    flex-shrink: 0;
                    padding: 10px 18px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid var(--accent-cyan);
                    background: transparent;
                    color: var(--accent-cyan);
                    font-family: var(--font-mono);
                    transition: all var(--transition-normal);
                }
                .recovery-action-card__button:hover {
                    background: var(--accent-cyan);
                    color: var(--bg-primary);
                }
            `}</style>
        </div>
    );
}

export default RecoveryView;
