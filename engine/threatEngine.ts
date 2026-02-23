/**
 * Threat Engine
 * Handles persistent security threats that escalate over time
 * Integrates with economy engine for delayed consequences
 */

import { GameState, cloneState, type ActiveThreat, type ThreatSeverity, type ThreatType } from "./gameState";
import { scheduleLoss } from "./economyEngine";
import { getEscalationDelayBonus } from "./skillEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for creating a new threat
 */
export interface ThreatOptions {
    id: string;
    type: ThreatType;
    severity?: ThreatSeverity;
    sourceScene: number;
}

/**
 * Configuration for threat escalation behavior
 */
export interface EscalationConfig {
    /** Number of scenes before low -> medium escalation */
    lowToMediumScenes?: number;
    /** Number of scenes before medium -> high escalation */
    mediumToHighScenes?: number;
    /** Whether high severity threats trigger immediate consequences */
    triggerConsequencesOnHigh?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
    lowToMediumScenes: 2,
    mediumToHighScenes: 2,
    triggerConsequencesOnHigh: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Core Threat Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a new active threat to the game state
 * Threats persist across scenes until resolved
 * 
 * @param state - Current game state
 * @param options - Threat configuration
 * @param sceneProgressionCount - Current scene progression count (for escalation tracking)
 * @returns New state with threat added
 */
export function addThreat(
    state: GameState,
    options: ThreatOptions,
    sceneProgressionCount: number
): GameState {
    const { id, type, severity = "low", sourceScene } = options;
    
    // Clone state to ensure immutability
    const newState = cloneState(state);
    
    // Check if threat already exists (prevent duplicates)
    const existingThreat = newState.activeThreats.find((t) => t.id === id);
    if (existingThreat && !existingThreat.resolved) {
        // Threat already exists and is active, return unchanged
        return newState;
    }
    
    // Create new threat with scene progression tracking
    const threat: ActiveThreat = {
        id,
        type,
        severity,
        sourceScene,
        resolved: false,
        createdAt: Date.now(),
        createdAtSceneProgression: sceneProgressionCount,
    };
    
    newState.activeThreats.push(threat);
    
    return newState;
}

/**
 * Escalates threats based on scene progression
 * Low -> Medium -> High severity progression
 * High severity threats can trigger delayed consequences
 * 
 * @param state - Current game state
 * @param sceneProgressionCount - Current scene progression count
 * @param config - Optional escalation configuration
 * @returns New state with escalated threats
 */
export function escalateThreats(
    state: GameState,
    sceneProgressionCount: number,
    config: EscalationConfig = DEFAULT_ESCALATION_CONFIG
): GameState {
    const {
        lowToMediumScenes: baseLowToMedium = 2,
        mediumToHighScenes: baseMediumToHigh = 2,
        triggerConsequencesOnHigh = true,
    } = config;

    // High wifiAwareness = slower escalation (skill effect)
    const delayBonus = getEscalationDelayBonus(state);
    const lowToMediumScenes = baseLowToMedium + delayBonus;
    const mediumToHighScenes = baseMediumToHigh + delayBonus;
    
    // Clone state to ensure immutability
    let newState = cloneState(state);
    
    // Escalate unresolved threats based on their age
    for (const threat of newState.activeThreats) {
        if (threat.resolved) continue;
        
        // Calculate scenes since threat was created
        const scenesSinceCreation = sceneProgressionCount - threat.createdAtSceneProgression;
        
        // Escalate based on current severity and age
        if (threat.severity === "low") {
            // Escalate to medium after lowToMediumScenes scenes
            if (scenesSinceCreation >= lowToMediumScenes) {
                threat.severity = "medium";
            }
        } else if (threat.severity === "medium") {
            // Escalate to high after mediumToHighScenes more scenes (total from creation)
            const totalScenesForHigh = lowToMediumScenes + mediumToHighScenes;
            if (scenesSinceCreation >= totalScenesForHigh) {
                threat.severity = "high";
                
                // Trigger consequences for high severity threats (only once)
                if (triggerConsequencesOnHigh) {
                    const lossAmount = getThreatLossAmount(threat.type, "high");
                    const lossReason = getThreatLossReason(threat.type, "high");
                    
                    // Schedule a delayed loss (trigger after 1 scene)
                    newState = scheduleLoss(
                        newState,
                        {
                            amount: lossAmount,
                            reason: lossReason,
                            triggerAfterScenes: 1,
                        },
                        sceneProgressionCount
                    );
                }
            }
        }
    }
    
    return newState;
}

/**
 * Resolves a threat, marking it as no longer active
 * 
 * @param state - Current game state
 * @param threatId - ID of the threat to resolve
 * @returns New state with threat resolved
 */
export function resolveThreat(
    state: GameState,
    threatId: string
): GameState {
    // Clone state to ensure immutability
    const newState = cloneState(state);
    
    // Find and resolve the threat
    const threat = newState.activeThreats.find((t) => t.id === threatId);
    if (threat) {
        threat.resolved = true;
    }
    
    return newState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gets the number of active (unresolved) threats
 * 
 * @param state - Current game state
 * @returns Count of active threats
 */
export function getActiveThreatCount(state: GameState): number {
    return state.activeThreats.filter((t) => !t.resolved).length;
}

/**
 * Gets all active (unresolved) threats
 * 
 * @param state - Current game state
 * @returns Array of active threats
 */
export function getActiveThreats(state: GameState): ActiveThreat[] {
    return state.activeThreats.filter((t) => !t.resolved);
}

/**
 * Gets threats by severity level
 * 
 * @param state - Current game state
 * @param severity - Severity level to filter by
 * @returns Array of threats with the specified severity
 */
export function getThreatsBySeverity(
    state: GameState,
    severity: ThreatSeverity
): ActiveThreat[] {
    return state.activeThreats.filter(
        (t) => !t.resolved && t.severity === severity
    );
}

/**
 * Checks if a specific threat type is active
 * 
 * @param state - Current game state
 * @param threatType - Type of threat to check
 * @returns True if an active threat of this type exists
 */
export function hasActiveThreat(
    state: GameState,
    threatType: ThreatType
): boolean {
    return state.activeThreats.some(
        (t) => !t.resolved && t.type === threatType
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gets the financial loss amount for a threat based on type and severity
 * Data-driven: can be customized per threat type
 * 
 * @param threatType - Type of threat
 * @param severity - Current severity level
 * @returns Loss amount in rupees
 */
function getThreatLossAmount(threatType: ThreatType, severity: ThreatSeverity): number {
    // Base loss amounts by severity
    const baseLosses: Record<ThreatSeverity, number> = {
        low: 200,
        medium: 500,
        high: 1200,
    };
    
    // Type-specific multipliers (can be customized)
    const typeMultipliers: Record<string, number> = {
        session_hijack: 1.5,
        credential_leak: 1.2,
        device_tracked: 1.0,
    };
    
    const baseAmount = baseLosses[severity];
    const multiplier = typeMultipliers[threatType] ?? 1.0;
    
    return Math.round(baseAmount * multiplier);
}

/**
 * Gets the loss reason message for a threat
 * 
 * @param threatType - Type of threat
 * @param severity - Current severity level
 * @returns Human-readable loss reason
 */
function getThreatLossReason(threatType: ThreatType, severity: ThreatSeverity): string {
    const typeNames: Record<string, string> = {
        session_hijack: "Session hijacked",
        credential_leak: "Credential leak",
        device_tracked: "Device tracking",
    };
    
    const typeName = typeNames[threatType] ?? threatType;
    const severityText = severity === "high" ? "critical" : severity;
    
    return `${typeName} - ${severityText} severity threat escalated`;
}
