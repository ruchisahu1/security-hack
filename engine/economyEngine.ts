/**
 * Economy Engine
 * Handles financial losses, delayed consequences, and balance management
 * Data-driven system that integrates with the game engine
 */

import { GameState, cloneState, type PendingLoss, type LossHistoryEntry } from "./gameState";
import { getLossMultiplier } from "./skillEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for applying an immediate financial loss
 */
export interface ImmediateLossOptions {
    amount: number;
    reason: string;
}

/**
 * Options for scheduling a delayed financial loss
 */
export interface ScheduledLossOptions {
    amount: number;
    reason: string;
    triggerAfterScenes?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Economy Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies an immediate financial loss to the player's balance
 * Records the loss in history for traceability
 * 
 * @param state - Current game state
 * @param options - Loss amount and reason
 * @returns New state with updated balance and loss history
 */
export function applyImmediateLoss(
    state: GameState,
    options: ImmediateLossOptions
): GameState {
    const { amount, reason } = options;
    const multiplier = getLossMultiplier(state);
    const adjustedAmount = Math.round(amount * multiplier);

    // Clone state to ensure immutability
    const newState = cloneState(state);

    // Ensure balance doesn't go below zero
    const actualLoss = Math.min(adjustedAmount, newState.balance);
    newState.balance = Math.max(0, newState.balance - adjustedAmount);
    
    // Record loss in history
    const lossEntry: LossHistoryEntry = {
        amount: actualLoss,
        reason,
        sceneId: state.currentScene,
    };
    newState.lossHistory.push(lossEntry);
    
    return newState;
}

/**
 * Schedules a financial loss to be applied after a delay
 * The loss will be applied when resolvePendingLosses is called
 * 
 * @param state - Current game state
 * @param options - Loss amount, reason, and optional delay
 * @param sceneProgressionCount - Current scene progression count (actionsTaken.length)
 * @returns New state with pending loss added
 */
export function scheduleLoss(
    state: GameState,
    options: ScheduledLossOptions,
    sceneProgressionCount: number
): GameState {
    const { amount, reason, triggerAfterScenes } = options;
    
    // Clone state to ensure immutability
    const newState = cloneState(state);
    
    // Create pending loss entry with scheduling timestamp
    const pendingLoss: PendingLoss = {
        amount,
        reason,
        triggerAfterScenes: triggerAfterScenes ?? 0,
        scheduledAtScene: sceneProgressionCount,
    };
    
    newState.pendingLosses.push(pendingLoss);
    
    return newState;
}

/**
 * Resolves pending losses that are ready to be applied
 * Losses with triggerAfterScenes are applied when enough scenes have passed since scheduling
 * 
 * @param state - Current game state
 * @param sceneProgressionCount - Current scene progression count (actionsTaken.length)
 * @returns New state with pending losses resolved
 */
export function resolvePendingLosses(
    state: GameState,
    sceneProgressionCount: number
): GameState {
    // Clone state to ensure immutability
    const newState = cloneState(state);
    
    // Track which losses to apply and which to keep
    const lossesToApply: PendingLoss[] = [];
    const lossesToKeep: PendingLoss[] = [];
    
    // Separate losses that are ready vs those that need more delay
    for (const loss of newState.pendingLosses) {
        const scenesSinceScheduled = sceneProgressionCount - loss.scheduledAtScene;
        const triggerAfter = loss.triggerAfterScenes ?? 0;
        
        // Loss is ready if enough scenes have passed since it was scheduled
        if (scenesSinceScheduled >= triggerAfter) {
            lossesToApply.push(loss);
        } else {
            lossesToKeep.push(loss);
        }
    }
    
    // Apply all ready losses (skill multiplier applied at resolution time)
    for (const loss of lossesToApply) {
        const multiplier = getLossMultiplier(newState);
        const adjustedAmount = Math.round(loss.amount * multiplier);
        const actualLoss = Math.min(adjustedAmount, newState.balance);
        newState.balance = Math.max(0, newState.balance - adjustedAmount);

        // Record in history
        const lossEntry: LossHistoryEntry = {
            amount: actualLoss,
            reason: loss.reason,
            sceneId: state.currentScene,
        };
        newState.lossHistory.push(lossEntry);
    }
    
    // Update pending losses list (keep only those not yet triggered)
    newState.pendingLosses = lossesToKeep;
    
    return newState;
}

/**
 * Gets the total amount of pending losses
 * Useful for UI display or warnings
 * 
 * @param state - Current game state
 * @returns Total amount of all pending losses
 */
export function getTotalPendingLosses(state: GameState): number {
    return state.pendingLosses.reduce((total, loss) => total + loss.amount, 0);
}

/**
 * Gets the most recent loss from history
 * Useful for displaying loss notifications
 * 
 * @param state - Current game state
 * @returns Most recent loss entry or null if no losses
 */
export function getMostRecentLoss(state: GameState): LossHistoryEntry | null {
    if (state.lossHistory.length === 0) {
        return null;
    }
    return state.lossHistory[state.lossHistory.length - 1];
}
