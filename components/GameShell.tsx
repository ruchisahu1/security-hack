"use client";


import { useReducer, useCallback, useMemo } from "react";
import {
    type GameState,
    type SceneOption,
    type Verdict,
    createInitialGameState,
    applyChoice,
    generateVerdict,
    getMostRecentLoss,
    getActiveThreatCount,
    shouldEnterRecovery,
    applyRecoveryAction,
    getRecoveryOutcome,
    createRecoverySnapshot,
    type RecoverySnapshot,
} from "../engine";
import { SceneRenderer, type SceneData } from "./SceneRenderer";
import { EvidenceBoard } from "./EvidenceBoard";
import { VerdictModal } from "./VerdictModal";
import { RecoveryView } from "./RecoveryView";
import { RiskMeter } from "./RiskMeter";
import { SystemMessages } from "./SystemMessages";
import { RevealView } from "./RevealView";
import { BalanceDisplay } from "./BalanceDisplay";
import { ThreatIndicator } from "./ThreatIndicator";

/**
 * Game case data structure - passed in from parent
 */
export interface CaseData {
    id: string;
    title: string;
    description: string;
    scenes: SceneData[];
}

interface GameShellProps {
    caseData: CaseData;
    onGameComplete?: (verdict: Verdict, state: GameState) => void;
    /** If true, hide the risk meter during gameplay (default: true for hidden risk feature) */
    hideRiskDuringPlay?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────────────────

type GamePhase = "playing" | "recovery" | "reveal" | "verdict";

type GameAction =
    | { type: "SELECT_CHOICE"; option: SceneOption }
    | { type: "RESET_GAME" }
    | { type: "SHOW_VERDICT" }
    | { type: "CLOSE_VERDICT" }
    | { type: "RECOVERY_ACTION"; actionId: string }
    | { type: "PROCEED_FROM_RECOVERY" };

interface GameUIState {
    gameState: GameState;
    phase: GamePhase;
    verdict: Verdict | null;
    visitedSceneIds: number[];
    /** Only set when phase === "recovery" */
    recoveryState: GameState | null;
    recoverySnapshot: RecoverySnapshot | null;
    recoveryUsedActionIds: string[];
    recoveryMoneyRecoveredSoFar: number;
    recoveryTurns: number;
    recoveryLastMessage: string | null;
}

function gameReducer(state: GameUIState, action: GameAction): GameUIState {
    switch (action.type) {
        case "SELECT_CHOICE": {
            const result = applyChoice(state.gameState, action.option);
            const newState = result.newState;

            // Track visited scenes (current scene before moving)
            const newVisitedIds = state.visitedSceneIds.includes(state.gameState.currentScene)
                ? state.visitedSceneIds
                : [...state.visitedSceneIds, state.gameState.currentScene];

            if (newState.finished) {
                if (shouldEnterRecovery(newState)) {
                    const snapshot = createRecoverySnapshot(newState, [], 0);
                    return {
                        gameState: newState,
                        phase: "recovery",
                        verdict: null,
                        visitedSceneIds: newVisitedIds,
                        recoveryState: { ...newState },
                        recoverySnapshot: snapshot,
                        recoveryUsedActionIds: [],
                        recoveryMoneyRecoveredSoFar: 0,
                        recoveryTurns: 0,
                        recoveryLastMessage: null,
                    };
                }
                const verdict = generateVerdict(newState);
                return {
                    gameState: newState,
                    phase: "reveal",
                    verdict,
                    visitedSceneIds: newVisitedIds,
                    recoveryState: null,
                    recoverySnapshot: null,
                    recoveryUsedActionIds: [],
                    recoveryMoneyRecoveredSoFar: 0,
                    recoveryTurns: 0,
                    recoveryLastMessage: null,
                };
            }

            return {
                ...state,
                gameState: newState,
                visitedSceneIds: newVisitedIds,
            };
        }

        case "SHOW_VERDICT":
            return {
                ...state,
                phase: "verdict",
            };

        case "RECOVERY_ACTION": {
            if (state.phase !== "recovery" || !state.recoveryState || !state.recoverySnapshot)
                return state;
            const result = applyRecoveryAction(state.recoveryState, action.actionId, {
                usedActionIds: state.recoveryUsedActionIds,
                moneyRecoveredSoFar: state.recoveryMoneyRecoveredSoFar,
            });
            if (!result) return state;
            const actionsTakenInRecovery = [
                ...state.recoverySnapshot.actionsTakenInRecovery,
                result.actionUsed.label,
            ];
            const snapshot = createRecoverySnapshot(
                result.newState,
                actionsTakenInRecovery,
                state.recoveryTurns + result.actionUsed.timeCost
            );
            return {
                ...state,
                recoveryState: result.newState,
                recoverySnapshot: snapshot,
                recoveryUsedActionIds: [...state.recoveryUsedActionIds, action.actionId],
                recoveryMoneyRecoveredSoFar:
                    state.recoveryMoneyRecoveredSoFar + result.moneyRecovered,
                recoveryTurns: state.recoveryTurns + result.actionUsed.timeCost,
                recoveryLastMessage: result.message,
            };
        }

        case "PROCEED_FROM_RECOVERY": {
            if (state.phase !== "recovery" || !state.recoveryState || !state.recoverySnapshot)
                return state;
            const recoveryOutcome = getRecoveryOutcome(state.recoveryState, state.recoverySnapshot);
            const verdict = generateVerdict(state.recoveryState, undefined, recoveryOutcome);
            return {
                gameState: state.recoveryState,
                phase: "reveal",
                verdict,
                visitedSceneIds: state.visitedSceneIds,
                recoveryState: null,
                recoverySnapshot: null,
                recoveryUsedActionIds: [],
                recoveryMoneyRecoveredSoFar: 0,
                recoveryTurns: 0,
                recoveryLastMessage: null,
            };
        }

        case "RESET_GAME":
            return {
                gameState: createInitialGameState(),
                phase: "playing",
                verdict: null,
                visitedSceneIds: [],
                recoveryState: null,
                recoverySnapshot: null,
                recoveryUsedActionIds: [],
                recoveryMoneyRecoveredSoFar: 0,
                recoveryTurns: 0,
                recoveryLastMessage: null,
            };

        case "CLOSE_VERDICT":
            return {
                ...state,
                phase: "playing",
                recoveryState: null,
                recoverySnapshot: null,
                recoveryUsedActionIds: [],
                recoveryMoneyRecoveredSoFar: 0,
                recoveryTurns: 0,
                recoveryLastMessage: null,
            };

        default:
            return state;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function GameShell({
    caseData,
    onGameComplete,
    hideRiskDuringPlay = true,
}: GameShellProps) {
    const initialState: GameUIState = {
        gameState: createInitialGameState(),
        phase: "playing",
        verdict: null,
        visitedSceneIds: [],
        recoveryState: null,
        recoverySnapshot: null,
        recoveryUsedActionIds: [],
        recoveryMoneyRecoveredSoFar: 0,
        recoveryTurns: 0,
        recoveryLastMessage: null,
    };

    const [state, dispatch] = useReducer(gameReducer, initialState);

    const currentScene = useMemo(() => {
        return caseData.scenes.find(
            (scene) => scene.id === state.gameState.currentScene
        ) ?? null;
    }, [caseData.scenes, state.gameState.currentScene]);

    // Check if any scene has attacker narration
    const hasAttackerContent = useMemo(() => {
        return caseData.scenes.some((scene) => scene.attackerNarration);
    }, [caseData.scenes]);

    const handleChoiceSelect = useCallback((option: SceneOption) => {
        dispatch({ type: "SELECT_CHOICE", option });
    }, []);

    const handleRevealClose = useCallback(() => {
        dispatch({ type: "SHOW_VERDICT" });
    }, []);

    const handleReplay = useCallback(() => {
        dispatch({ type: "RESET_GAME" });
    }, []);

    const handleCloseVerdict = useCallback(() => {
        dispatch({ type: "CLOSE_VERDICT" });
        if (state.verdict && onGameComplete) {
            onGameComplete(state.verdict, state.gameState);
        }
    }, [state.verdict, state.gameState, onGameComplete]);

    // Determine if risk should be shown
    const showRisk = !hideRiskDuringPlay || state.phase !== "playing";

    // Get most recent loss for notification display
    const recentLoss = getMostRecentLoss(state.gameState);
    
    // Get active threat count
    const activeThreatCount = getActiveThreatCount(state.gameState);

    return (
        <div className="game-shell">
            <header className="game-shell__header">
                <div className="game-shell__header-content">
                    <div className="game-shell__header-text">
                        <h1 className="game-shell__title">{caseData.title}</h1>
                        <p className="game-shell__description">{caseData.description}</p>
                    </div>
                    <div className="game-shell__header-balance">
                        <BalanceDisplay
                            balance={state.gameState.balance}
                            recentLoss={recentLoss}
                            showLabel={true}
                        />
                    </div>
                </div>
            </header>

            {/* Risk Meter - hidden during play, shown after game ends */}
            {showRisk && (
                <div className="game-shell__risk">
                    <RiskMeter riskScore={state.gameState.riskScore} />
                </div>
            )}

            {/* Threat Indicator - shown during play */}
            {state.phase === "playing" && (
                <div className="game-shell__threats">
                    <ThreatIndicator activeThreatCount={activeThreatCount} />
                </div>
            )}

            {/* System Messages - shown during play as delayed feedback */}
            {state.phase === "playing" && state.gameState.systemMessages.length > 0 && (
                <div className="game-shell__messages">
                    <SystemMessages messages={state.gameState.systemMessages} />
                </div>
            )}

            {/* Main gameplay area */}
            {state.phase === "playing" && (
                <main className="game-shell__main">
                    <div className="game-shell__scene">
                        <SceneRenderer
                            scene={currentScene}
                            onChoiceSelect={handleChoiceSelect}
                            disabled={state.gameState.finished}
                        />
                    </div>

                    <aside className="game-shell__sidebar">
                        <EvidenceBoard evidence={state.gameState.evidence} />
                    </aside>
                </main>
            )}

            {/* Recovery phase - post-incident actions */}
            {state.phase === "recovery" &&
                state.recoveryState &&
                state.recoverySnapshot && (
                    <main className="game-shell__main game-shell__main--recovery">
                        <RecoveryView
                            gameState={state.recoveryState}
                            snapshot={state.recoverySnapshot}
                            usedActionIds={state.recoveryUsedActionIds}
                            moneyRecoveredSoFar={state.recoveryMoneyRecoveredSoFar}
                            totalRecoveryTurns={state.recoveryTurns}
                            lastResultMessage={state.recoveryLastMessage}
                            onActionSelect={(actionId) =>
                                dispatch({ type: "RECOVERY_ACTION", actionId })
                            }
                            onProceedToSummary={() =>
                                dispatch({ type: "PROCEED_FROM_RECOVERY" })
                            }
                        />
                    </main>
                )}

            {/* Reveal phase - split screen view */}
            {state.phase === "reveal" && hasAttackerContent && (
                <div className="game-shell__reveal">
                    <RevealView
                        actionsTaken={state.gameState.actionsTaken}
                        scenes={caseData.scenes}
                        visitedSceneIds={state.visitedSceneIds}
                        onClose={handleRevealClose}
                    />
                </div>
            )}

            {/* Skip reveal if no attacker content - go straight to verdict */}
            {state.phase === "reveal" && !hasAttackerContent && state.verdict && (
                <VerdictModal
                    verdict={state.verdict}
                    isOpen={true}
                    onReplay={handleReplay}
                    onClose={handleCloseVerdict}

                />
            )}

            {/* Verdict modal */}
            {state.phase === "verdict" && state.verdict && (
                <VerdictModal
                    verdict={state.verdict}
                    isOpen={true}
                    onReplay={handleReplay}
                    onClose={handleCloseVerdict}
                    
                />
            )}

            <style jsx>{`
        /* ═══ GAME SHELL - Fullscreen immersive layout ═══ */
        .game-shell {
          min-height: 100vh;
          width: 100%;
          padding: 24px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        /* Subtle scanline overlay for cyber feel */
        .game-shell::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          );
          pointer-events: none;
          z-index: 1000;
        }
        
        /* ═══ Header - Case file label ═══ */
        .game-shell__header {
          max-width: 900px;
          width: 100%;
          margin: 0 auto 24px;
          padding: 20px 24px;
          background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          position: relative;
          overflow: visible;
        }
        
        /* Accent glow on header */
        .game-shell__header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
        }
        
        .game-shell__header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        
        .game-shell__header-text {
          flex: 1;
          min-width: 0;
        }
        
        .game-shell__header-balance {
          flex-shrink: 0;
          min-width: 180px;
        }
        
        .game-shell__title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
          font-family: var(--font-mono);
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }
        
        .game-shell__description {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          font-family: var(--font-mono);
        }
        
        /* ═══ Risk meter section ═══ */
        .game-shell__risk {
          max-width: 900px;
          width: 100%;
          margin: 0 auto 20px;
          background: var(--bg-elevated);
          padding: 16px 20px;
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
        }
        
        /* ═══ Threat indicator section ═══ */
        .game-shell__threats {
          max-width: 900px;
          width: 100%;
          margin: 0 auto 20px;
          animation: fade-in 0.3s ease;
        }
        
        /* ═══ System messages section ═══ */
        .game-shell__messages {
          max-width: 900px;
          width: 100%;
          margin: 0 auto 20px;
          animation: fade-in 0.3s ease;
        }
        
        /* ═══ Main game area - Centered case file ═══ */
        .game-shell__main {
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
          flex: 1;
        }
        
        .game-shell__main--recovery {
          grid-template-columns: 1fr;
          align-items: start;
          justify-items: center;
        }
        
        .game-shell__scene {
          min-width: 0;
          animation: fade-in 0.3s ease;
        }
        
        .game-shell__sidebar {
          min-width: 0;
        }
        
        /* ═══ Reveal view section ═══ */
        .game-shell__reveal {
          max-width: 900px;
          width: 100%;
          margin: 20px auto 0;
          animation: fade-in 0.4s ease;
        }
        
        /* ═══ Responsive ═══ */
        @media (max-width: 768px) {
          .game-shell {
            padding: 16px;
          }
          .game-shell__main {
            grid-template-columns: 1fr;
          }
          .game-shell__sidebar {
            order: -1;
          }
          .game-shell__title {
            font-size: 18px;
          }
          .game-shell__header-content {
            flex-direction: column;
            gap: 16px;
          }
          .game-shell__header-balance {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
        </div>
    );
}

export default GameShell;
