/**
 * Choice Application Engine
 * Handles state transitions based on player choices
 */

import {
    GameState,
    SceneOption,
    EvidenceItem,
    cloneState,
    hasEvidence,
} from "./gameState";
import { resolvePendingLosses, applyImmediateLoss, scheduleLoss } from "./economyEngine";
import { escalateThreats, addThreat, resolveThreat } from "./threatEngine";
import { applySkillGains, applySkillLosses } from "./skillEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Result of applying a choice, includes the new state and metadata
 */
export interface ChoiceResult {
    newState: GameState;
    evidenceCollected: EvidenceItem | null;
    riskChange: number;
    flagsChanged: string[];
}

/**
 * Options for customizing choice application behavior
 */
export interface ApplyChoiceOptions {
    /** If true, the game will mark as finished when reaching a terminal scene (-1) */
    autoFinishOnTerminal?: boolean;
    /** Maximum allowed risk score before auto-finishing */
    maxRiskScore?: number;
    /** Callback to determine if a choice is valid based on current state */
    validateChoice?: (state: GameState, option: SceneOption) => boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Choice Application
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies a player choice to the current game state
 * Returns a new state object (immutable operation)
 * 
 * @param state - Current game state
 * @param option - The choice option selected by the player
 * @param options - Optional configuration for choice application
 * @returns ChoiceResult with new state and metadata
 */
export function applyChoice(
    state: GameState,
    option: SceneOption,
    options: ApplyChoiceOptions = {}
): ChoiceResult {
    const {
        autoFinishOnTerminal = true,
        maxRiskScore = 100,
        validateChoice,
    } = options;

    // Validate choice if validator provided
    if (validateChoice && !validateChoice(state, option)) {
        // Return unchanged state if choice is invalid
        return {
            newState: cloneState(state),
            evidenceCollected: null,
            riskChange: 0,
            flagsChanged: [],
        };
    }

    // Clone state to ensure immutability
    let newState = cloneState(state);
    const flagsChanged: string[] = [];
    let evidenceCollected: EvidenceItem | null = null;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Update Risk Score
    // ─────────────────────────────────────────────────────────────────────────
    const riskChange = option.riskDelta;
    newState.riskScore = Math.max(0, newState.riskScore + riskChange);

    // Check for max risk exceeded
    if (newState.riskScore >= maxRiskScore) {
        newState.finished = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Apply Flags
    // ─────────────────────────────────────────────────────────────────────────
    if (option.flagsToSet) {
        for (const [flagName, flagValue] of Object.entries(option.flagsToSet)) {
            if (newState.flags[flagName] !== flagValue) {
                flagsChanged.push(flagName);
            }
            newState.flags[flagName] = flagValue;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Collect Evidence
    // ─────────────────────────────────────────────────────────────────────────
    if (option.evidence && !hasEvidence(state, option.evidence.id)) {
        evidenceCollected = {
            ...option.evidence,
            collectedAtScene: state.currentScene,
            timestamp: Date.now(),
        };
        newState.evidence.push(evidenceCollected);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Collect System Message (Delayed Feedback)
    // ─────────────────────────────────────────────────────────────────────────
    if (option.systemMessage) {
        newState.systemMessages.push(option.systemMessage);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4.5. Handle Economy Actions (Data-Driven)
    // ─────────────────────────────────────────────────────────────────────────
    if (option.immediateLoss) {
        newState = applyImmediateLoss(newState, {
            amount: option.immediateLoss.amount,
            reason: option.immediateLoss.reason,
        });
    }

    if (option.scheduledLoss) {
        const sceneProgressionCount = newState.actionsTaken.length;
        newState = scheduleLoss(
            newState,
            {
                amount: option.scheduledLoss.amount,
                reason: option.scheduledLoss.reason,
                triggerAfterScenes: option.scheduledLoss.triggerAfterScenes,
            },
            sceneProgressionCount
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4.6. Handle Threat Actions (Data-Driven)
    // ─────────────────────────────────────────────────────────────────────────
    if (option.threatToAdd) {
        const sceneProgressionCount = newState.actionsTaken.length;
        newState = addThreat(
            newState,
            {
                id: option.threatToAdd.id,
                type: option.threatToAdd.type,
                severity: option.threatToAdd.severity,
                sourceScene: state.currentScene,
            },
            sceneProgressionCount
        );
    }

    if (option.threatToResolve) {
        newState = resolveThreat(newState, option.threatToResolve);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4.7. Handle Skill Changes (Data-Driven)
    // ─────────────────────────────────────────────────────────────────────────
    if (option.skillGain) {
        newState = applySkillGains(newState, option.skillGain);
    }
    if (option.skillLoss) {
        newState = applySkillLosses(newState, option.skillLoss);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Record Action
    // ─────────────────────────────────────────────────────────────────────────
    newState.actionsTaken.push(option.actionLabel);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Progress Scene
    // ─────────────────────────────────────────────────────────────────────────
    newState.currentScene = option.nextScene;

    // Mark as finished if reaching terminal scene
    if (autoFinishOnTerminal && option.nextScene === -1) {
        newState.finished = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Resolve Pending Losses (Economy System)
    // ─────────────────────────────────────────────────────────────────────────
    // Resolve losses that are ready based on scene progression
    // Use actionsTaken length as a proxy for scene progression count
    const sceneProgressionCount = newState.actionsTaken.length;
    newState = resolvePendingLosses(newState, sceneProgressionCount);

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Escalate Threats (Threat System)
    // ─────────────────────────────────────────────────────────────────────────
    // Escalate threats based on scene progression
    newState = escalateThreats(newState, sceneProgressionCount);

    return {
        newState,
        evidenceCollected,
        riskChange,
        flagsChanged,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies multiple choices in sequence
 * Useful for replay or testing scenarios
 * 
 * @param initialState - Starting game state
 * @param options - Array of choices to apply in order
 * @returns Final state after all choices applied
 */
export function applyChoiceSequence(
    initialState: GameState,
    options: SceneOption[]
): GameState {
    return options.reduce(
        (state, option) => applyChoice(state, option).newState,
        initialState
    );
}

/**
 * Checks if a choice would result in game over (finished state)
 * 
 * @param state - Current game state
 * @param option - Choice to evaluate
 * @param maxRiskScore - Maximum risk threshold
 * @returns True if the choice would end the game
 */
export function wouldChoiceEndGame(
    state: GameState,
    option: SceneOption,
    maxRiskScore: number = 100
): boolean {
    if (option.nextScene === -1) return true;
    if (state.riskScore + option.riskDelta >= maxRiskScore) return true;
    return false;
}

/**
 * Filters available choices based on flag requirements
 * 
 * @param state - Current game state
 * @param options - All possible options
 * @param requirements - Map of option ID to required flags
 * @returns Filtered list of valid options
 */
export function filterAvailableChoices(
    state: GameState,
    options: SceneOption[],
    requirements: Record<string, string[]>
): SceneOption[] {
    return options.filter((option) => {
        const requiredFlags = requirements[option.id];
        if (!requiredFlags) return true;
        return requiredFlags.every((flag) => state.flags[flag] === true);
    });
}
