/**
 * Recovery Engine
 * Handles post-incident recovery: apply recovery actions, recover money, resolve threats.
 * Empowerment after failure — no instant fail; players can influence the final outcome.
 */

import {
    GameState,
    cloneState,
    type ActiveThreat,
    type LossHistoryEntry,
    type ThreatSeverity,
    type ThreatType,
} from "./gameState";
import { resolveThreat } from "./threatEngine";
import { getActiveThreats, getThreatsBySeverity } from "./threatEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recovery action definition (data-driven).
 * Each action has effectiveness, time cost, and threat resolution capability.
 */
export interface RecoveryActionDef {
    id: string;
    label: string;
    description: string;
    /** 0–1: fraction of recoverable money this action can recover */
    effectiveness: number;
    /** Time cost in "recovery turns" (affects speed-of-response score) */
    timeCost: number;
    /** Threat types this action can resolve (e.g. credential_leak, session_hijack) */
    resolvesThreatTypes?: ThreatType[];
    /** If set, resolves threats of this severity or lower */
    resolvesSeverityUpTo?: ThreatSeverity;
    /** Optional: only available if a flag is set (e.g. sharedRealCredentials) */
    requiresFlag?: string;
    /** Optional: only available if a threat type is active */
    requiresThreatType?: ThreatType;
    /** Practical advice shown after using this action */
    advice: string;
}

/**
 * Result of applying a recovery action
 */
export interface RecoveryActionResult {
    newState: GameState;
    moneyRecovered: number;
    threatsResolved: string[];
    actionUsed: RecoveryActionDef;
    message: string;
}

/**
 * Snapshot at incident (when recovery mode started) for summary
 */
export interface RecoverySnapshot {
    balanceAtIncident: number;
    totalMoneyLost: number;
    lossHistory: LossHistoryEntry[];
    activeThreatsAtIncident: ActiveThreat[];
    actionsTakenInRecovery: string[];
    totalRecoveryTurns: number;
}

/**
 * Final outcome category (recovery-aware)
 */
export type RecoveryOutcomeType =
    | "fully_safe"
    | "partially_recovered"
    | "damage_contained"
    | "severe_loss";

/**
 * Final outcome with summary data for the Final Summary page
 */
export interface RecoveryOutcome {
    type: RecoveryOutcomeType;
    title: string;
    explanation: string;
    /** Money lost before recovery */
    totalLost: number;
    /** Money recovered by player actions */
    moneyRecovered: number;
    /** Net loss after recovery */
    netLoss: number;
    /** Threats remaining (unresolved) after recovery */
    threatsRemaining: number;
    /** 0–1; higher = faster response (fewer turns) */
    responseSpeedScore: number;
    /** Practical advice based on outcome and actions */
    advice: string[];
    /** Incident summary bullets */
    incidentSummary: string[];
    /** Player response analysis bullets */
    responseAnalysis: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Recovery Actions (Data-Driven)
// ─────────────────────────────────────────────────────────────────────────────

export const RECOVERY_ACTIONS: RecoveryActionDef[] = [
    {
        id: "call_bank",
        label: "Call bank official number",
        description: "Contact your bank using the number on the back of your card or their official website.",
        effectiveness: 0.4,
        timeCost: 2,
        resolvesThreatTypes: ["credential_leak", "session_hijack"],
        resolvesSeverityUpTo: "medium",
        advice: "Always use the number on your card or official website — never trust numbers from SMS or emails.",
    },
    {
        id: "block_card_upi",
        label: "Block card / UPI",
        description: "Immediately block your card or UPI IDs through your bank app or customer care.",
        effectiveness: 0.6,
        timeCost: 1,
        resolvesThreatTypes: ["credential_leak", "session_hijack", "device_tracked"],
        resolvesSeverityUpTo: "high",
        advice: "Block first, then verify. Quick action limits how much an attacker can misuse your accounts.",
    },
    {
        id: "logout_all_sessions",
        label: "Logout all sessions",
        description: "Log out from all devices in your account settings and revoke active sessions.",
        effectiveness: 0.35,
        timeCost: 1,
        resolvesThreatTypes: ["session_hijack"],
        resolvesSeverityUpTo: "high",
        advice: "Check 'Active sessions' or 'Logged-in devices' in your account settings and sign out everywhere.",
    },
    {
        id: "report_cybercrime",
        label: "Report to cybercrime",
        description: "File a report with the national cybercrime portal or local police cyber cell.",
        effectiveness: 0.2,
        timeCost: 3,
        resolvesThreatTypes: [],
        advice: "Reporting helps authorities track patterns and may help in recovering funds in some cases.",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Recovery Mode Triggers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the game should enter recovery mode instead of ending.
 * Recovery starts when: money has been lost OR a high-severity threat is present.
 */
export function shouldEnterRecovery(state: GameState): boolean {
    const hasMoneyLost = state.lossHistory.length > 0;
    const highSeverityThreats = getThreatsBySeverity(state, "high");
    const hasHighThreat = highSeverityThreats.length > 0;
    return hasMoneyLost || hasHighThreat;
}

/**
 * Total money lost so far (from loss history)
 */
export function getTotalMoneyLost(state: GameState): number {
    return state.lossHistory.reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * Maximum recoverable amount (e.g. cap at 50% of total lost for realism)
 */
const MAX_RECOVERABLE_FRACTION = 0.5;

function getMaxRecoverable(totalLost: number): number {
    return Math.round(totalLost * MAX_RECOVERABLE_FRACTION);
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply Recovery Action
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns which recovery actions are available given current state and already-used action IDs.
 */
export function getAvailableRecoveryActions(
    state: GameState,
    usedActionIds: string[] = []
): RecoveryActionDef[] {
    const available = RECOVERY_ACTIONS.filter((action) => {
        if (usedActionIds.includes(action.id)) return false;
        if (action.requiresFlag && !state.flags[action.requiresFlag]) return false;
        if (action.requiresThreatType && !hasActiveThreatOfType(state, action.requiresThreatType))
            return false;
        return true;
    });
    return available;
}

function hasActiveThreatOfType(state: GameState, type: ThreatType): boolean {
    return state.activeThreats.some((t) => !t.resolved && t.type === type);
}

export interface ApplyRecoveryOptions {
    usedActionIds?: string[];
    moneyRecoveredSoFar?: number;
}

/**
 * Applies a recovery action: recovers money (capped), resolves matching threats, returns new state.
 */
export function applyRecoveryAction(
    state: GameState,
    actionId: string,
    options: ApplyRecoveryOptions = {}
): RecoveryActionResult | null {
    const { usedActionIds = [], moneyRecoveredSoFar = 0 } = options;
    const action = RECOVERY_ACTIONS.find((a) => a.id === actionId);
    if (!action || usedActionIds.includes(actionId)) return null;
    return applyRecoveryActionWithTrackedRecovery(state, actionId, moneyRecoveredSoFar);
}

/**
 * Applies a recovery action with known amount already recovered (so we can cap).
 */
export function applyRecoveryActionWithTrackedRecovery(
    state: GameState,
    actionId: string,
    moneyRecoveredSoFar: number
): RecoveryActionResult | null {
    const action = RECOVERY_ACTIONS.find((a) => a.id === actionId);
    if (!action) return null;

    const totalLost = getTotalMoneyLost(state);
    const maxRecoverable = getMaxRecoverable(totalLost);
    const remainingRecoverable = Math.max(0, maxRecoverable - moneyRecoveredSoFar);
    const recoverThisAction = Math.round(
        Math.min(remainingRecoverable, remainingRecoverable * action.effectiveness)
    );

    let newState = cloneState(state);
    const threatsResolved: string[] = [];

    // Resolve matching threats
    const active = getActiveThreats(newState);
    const severityOrder: ThreatSeverity[] = ["low", "medium", "high"];
    const maxSeverityIndex = action.resolvesSeverityUpTo
        ? severityOrder.indexOf(action.resolvesSeverityUpTo)
        : -1;

    for (const threat of active) {
        const typeMatch =
            !action.resolvesThreatTypes || action.resolvesThreatTypes.includes(threat.type);
        const severityOk =
            maxSeverityIndex >= 0 &&
            severityOrder.indexOf(threat.severity) <= maxSeverityIndex;
        if (typeMatch && severityOk) {
            newState = resolveThreat(newState, threat.id);
            threatsResolved.push(threat.id);
        }
    }

    // Apply money recovery (add back to balance, capped by recoverThisAction)
    newState.balance = newState.balance + recoverThisAction;

    const message =
        threatsResolved.length > 0 && recoverThisAction > 0
            ? `Recovered ₹${recoverThisAction} and secured ${threatsResolved.length} threat(s).`
            : recoverThisAction > 0
              ? `Recovered ₹${recoverThisAction}.`
              : threatsResolved.length > 0
                ? `Secured ${threatsResolved.length} threat(s).`
                : `Action recorded. ${action.advice}`;

    return {
        newState,
        moneyRecovered: recoverThisAction,
        threatsResolved,
        actionUsed: action,
        message,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Final Outcome (Recovery-Aware)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes recovery-aware outcome type and summary data for the Final Summary page.
 */
export function getRecoveryOutcome(
    state: GameState,
    snapshot: RecoverySnapshot
): RecoveryOutcome {
    const totalLost = snapshot.totalMoneyLost;
    const moneyRecoveredCorrect = Math.max(
        0,
        state.balance - snapshot.balanceAtIncident
    );
    const netLoss = totalLost - moneyRecoveredCorrect;
    const threatsRemaining = state.activeThreats.filter((t) => !t.resolved).length;
    const totalTurns = snapshot.totalRecoveryTurns;
    // Response speed: fewer turns = better. Assume "ideal" is 0 turns (no recovery needed) or 1–2 turns. Scale so 0 turns = 1, many turns = lower.
    const responseSpeedScore = totalTurns <= 2 ? 1 : Math.max(0, 1 - (totalTurns - 2) * 0.15);

    const incidentSummary = buildIncidentSummary(snapshot);
    const responseAnalysis = buildResponseAnalysis(
        state,
        snapshot,
        moneyRecoveredCorrect,
        threatsRemaining,
        responseSpeedScore
    );

    let type: RecoveryOutcomeType;
    let title: string;
    let explanation: string;
    let advice: string[];

    if (netLoss <= 0 && threatsRemaining === 0) {
        type = "fully_safe";
        title = "Fully Safe";
        explanation =
            "You contained the incident and recovered or prevented further damage. Your response made a real difference.";
        advice = [
            "Keep your bank and cybercrime helpline numbers saved in your phone.",
            "Enable transaction alerts and 2FA on all financial accounts.",
        ];
    } else if (moneyRecoveredCorrect > 0 || threatsRemaining < snapshot.activeThreatsAtIncident.length) {
        type = "partially_recovered";
        title = "Partially Recovered";
        explanation =
            "Your recovery actions limited the damage. Some loss or risk remains, but your response helped.";
        advice = [
            "Continue monitoring your accounts for unusual activity.",
            snapshot.actionsTakenInRecovery.some((a) => a.includes("block"))
                ? "You blocked quickly — good. Consider changing passwords for any exposed accounts."
                : "Consider blocking cards or changing passwords if you haven’t already.",
            "Report to cybercrime if you haven’t — it helps build cases.",
        ];
    } else if (threatsRemaining === 0 || netLoss < totalLost) {
        type = "damage_contained";
        title = "Damage Contained";
        explanation =
            "You took steps to stop further damage. Financial loss occurred, but you’ve reduced ongoing risk.";
        advice = [
            "Review which recovery steps you took and which you could add next time.",
            "Save official bank and cybercrime numbers so you can act fast.",
        ];
    } else {
        type = "severe_loss";
        title = "Severe Loss";
        explanation =
            "The incident led to significant loss. Use this as a learning moment: in real life, the same recovery actions (calling bank, blocking card, logging out, reporting) can still limit damage if you act quickly.";
        advice = [
            "In a real incident: call the bank and block card/UPI as soon as you suspect something.",
            "Log out from all sessions and change passwords from a trusted device.",
            "Report to the national cybercrime portal — every report helps.",
        ];
    }

    return {
        type,
        title,
        explanation,
        totalLost,
        moneyRecovered: moneyRecoveredCorrect,
        netLoss,
        threatsRemaining,
        responseSpeedScore,
        advice,
        incidentSummary,
        responseAnalysis,
    };
}

function buildIncidentSummary(snapshot: RecoverySnapshot): string[] {
    const lines: string[] = [];
    const totalLost = snapshot.totalMoneyLost;
    if (totalLost > 0) {
        lines.push(`Total financial loss: ₹${totalLost}`);
    }
    if (snapshot.lossHistory.length > 0) {
        const reasons = [...new Set(snapshot.lossHistory.map((l) => l.reason))];
        reasons.slice(0, 3).forEach((r) => lines.push(`• ${r}`));
    }
    if (snapshot.activeThreatsAtIncident.length > 0) {
        lines.push(
            `${snapshot.activeThreatsAtIncident.length} active threat(s) at time of incident.`
        );
    }
    return lines.length > 0 ? lines : ["No incident details recorded."];
}

function buildResponseAnalysis(
    state: GameState,
    snapshot: RecoverySnapshot,
    moneyRecovered: number,
    threatsRemaining: number,
    responseSpeedScore: number
): string[] {
    const lines: string[] = [];
    if (snapshot.actionsTakenInRecovery.length > 0) {
        lines.push(`Recovery actions taken: ${snapshot.actionsTakenInRecovery.join(", ")}.`);
    }
    if (moneyRecovered > 0) {
        lines.push(`Amount recovered: ₹${moneyRecovered}.`);
    }
    if (threatsRemaining < snapshot.activeThreatsAtIncident.length) {
        const resolved = snapshot.activeThreatsAtIncident.length - threatsRemaining;
        lines.push(`${resolved} threat(s) resolved during recovery.`);
    }
    if (responseSpeedScore >= 0.8) {
        lines.push("Fast response — you acted quickly after the incident.");
    } else if (responseSpeedScore >= 0.5) {
        lines.push("Moderate response time. Acting sooner usually limits damage further.");
    }
    return lines.length > 0 ? lines : ["No recovery actions were taken."];
}

/**
 * Creates a recovery snapshot from current state (call when entering recovery).
 */
export function createRecoverySnapshot(
    state: GameState,
    actionsTakenInRecovery: string[] = [],
    totalRecoveryTurns: number = 0
): RecoverySnapshot {
    return {
        balanceAtIncident: state.balance,
        totalMoneyLost: getTotalMoneyLost(state),
        lossHistory: state.lossHistory.map((e) => ({ ...e })),
        activeThreatsAtIncident: state.activeThreats.map((t) => ({ ...t })),
        actionsTakenInRecovery: [...actionsTakenInRecovery],
        totalRecoveryTurns,
    };
}
