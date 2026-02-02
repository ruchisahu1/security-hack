/**
 * Skill Engine
 * Passive progression: good decisions increase skills, repeated mistakes decrease.
 * Skills influence threat escalation and economy; never shown during gameplay.
 */

import { GameState, cloneState, type PlayerSkills } from "./gameState";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_MIN = 0;
const SKILL_MAX = 100;

const SKILL_KEYS: (keyof PlayerSkills)[] = [
    "wifiAwareness",
    "phishingAwareness",
    "paymentSafety",
];

// ─────────────────────────────────────────────────────────────────────────────
// Core Skill Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clamps a skill value to the valid range [0, 100].
 */
function clampSkill(value: number): number {
    return Math.max(SKILL_MIN, Math.min(SKILL_MAX, Math.round(value)));
}

/**
 * Increases a skill. Used when the player makes a correct decision.
 *
 * @param state - Current game state
 * @param skill - Skill key to increase
 * @param amount - Positive amount to add (will be clamped)
 * @returns New state with updated skill
 */
export function increaseSkill(
    state: GameState,
    skill: keyof PlayerSkills,
    amount: number
): GameState {
    const newState = cloneState(state);
    const current = newState.skills[skill];
    newState.skills[skill] = clampSkill(current + Math.max(0, amount));
    return newState;
}

/**
 * Decreases a skill. Used when the player makes a repeated or bad decision.
 *
 * @param state - Current game state
 * @param skill - Skill key to decrease
 * @param amount - Positive amount to subtract (will be clamped)
 * @returns New state with updated skill
 */
export function decreaseSkill(
    state: GameState,
    skill: keyof PlayerSkills,
    amount: number
): GameState {
    const newState = cloneState(state);
    const current = newState.skills[skill];
    newState.skills[skill] = clampSkill(current - Math.max(0, amount));
    return newState;
}

/**
 * Applies partial skill gains (from option.skillGain).
 *
 * @param state - Current game state
 * @param gains - Partial skills object; only defined keys are increased
 * @returns New state with updated skills
 */
export function applySkillGains(
    state: GameState,
    gains: Partial<PlayerSkills>
): GameState {
    let newState = cloneState(state);
    for (const key of SKILL_KEYS) {
        const delta = gains[key];
        if (delta != null && delta > 0) {
            newState = increaseSkill(newState, key, delta);
        }
    }
    return newState;
}

/**
 * Applies partial skill losses (from option.skillLoss).
 *
 * @param state - Current game state
 * @param losses - Partial skills object; only defined keys are decreased
 * @returns New state with updated skills
 */
export function applySkillLosses(
    state: GameState,
    losses: Partial<PlayerSkills>
): GameState {
    let newState = cloneState(state);
    for (const key of SKILL_KEYS) {
        const delta = losses[key];
        if (delta != null && delta > 0) {
            newState = decreaseSkill(newState, key, delta);
        }
    }
    return newState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skill Effects (for threat & economy integration)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns extra scenes required before threat escalation when wifiAwareness is high.
 * High skill = slower escalation (easier game).
 *
 * @param state - Current game state
 * @returns Number of extra scenes to add before low→medium and medium→high
 */
export function getEscalationDelayBonus(state: GameState): number {
    const s = state.skills.wifiAwareness;
    if (s >= 80) return 2;
    if (s >= 60) return 1;
    return 0;
}

/**
 * Returns a multiplier for financial loss based on paymentSafety.
 * Low skill = harsher loss (1.0–1.3); high skill = softer loss (0.7–1.0).
 *
 * @param state - Current game state
 * @returns Multiplier to apply to loss amount (e.g. 1.2 = 20% more loss)
 */
export function getLossMultiplier(state: GameState): number {
    const s = state.skills.paymentSafety;
    if (s >= 80) return 0.85;
    if (s >= 60) return 0.95;
    if (s <= 30) return 1.2;
    if (s <= 45) return 1.1;
    return 1.0;
}

/**
 * Returns bonus seconds for decision timers when wifiAwareness is high.
 *
 * @param state - Current game state
 * @returns Extra seconds to add to timer duration (0, 2, or 4)
 */
export function getTimerBonusSeconds(state: GameState): number {
    const s = state.skills.wifiAwareness;
    if (s >= 80) return 4;
    if (s >= 60) return 2;
    return 0;
}

/**
 * Returns current skills (for verdict summary only).
 */
export function getSkills(state: GameState): PlayerSkills {
    return { ...state.skills };
}
