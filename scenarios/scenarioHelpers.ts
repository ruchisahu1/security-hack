/**
 * Scenario Helpers
 * Utilities for building connected scenarios that react to game state
 */

import type { GameState, SceneOption } from "../engine/gameState";
import { hasActiveThreat, getActiveThreats, type ThreatType } from "../engine/threatEngine";
import { hasFlag } from "../engine/gameState";

/**
 * Scenario definition structure
 */
export interface ScenarioDefinition {
    id: string;
    title: string;
    intro: string;
    scenes: SceneData[];
}

/**
 * Helper to build scene descriptions that react to existing threats
 */
export function buildThreatAwareDescription(
    baseDescription: string,
    state: GameState,
    threatChecks: { type: ThreatType; message: string }[]
): string {
    const activeThreats = getActiveThreats(state);
    if (activeThreats.length === 0) {
        return baseDescription;
    }

    const threatMessages: string[] = [];
    for (const check of threatChecks) {
        if (hasActiveThreat(state, check.type)) {
            threatMessages.push(check.message);
        }
    }

    if (threatMessages.length > 0) {
        return `${baseDescription}\n\n⚠️ ${threatMessages.join(" ")}`;
    }

    return baseDescription;
}

/**
 * Helper to add threat escalation options to a scene
 */
export function addThreatEscalationOption(
    options: SceneOption[],
    state: GameState,
    threatType: ThreatType,
    escalationOption: SceneOption
): SceneOption[] {
    if (hasActiveThreat(state, threatType)) {
        return [...options, escalationOption];
    }
    return options;
}

/**
 * Helper to modify scene description based on flags
 */
export function buildFlagAwareDescription(
    baseDescription: string,
    state: GameState,
    flagChecks: { flag: string; message: string }[]
): string {
    const messages: string[] = [];
    for (const check of flagChecks) {
        if (hasFlag(state, check.flag)) {
            messages.push(check.message);
        }
    }

    if (messages.length > 0) {
        return `${baseDescription}\n\n${messages.join(" ")}`;
    }

    return baseDescription;
}
