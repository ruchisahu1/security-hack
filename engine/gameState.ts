/**
 * Core Game State Types and Initial State
 * Framework-agnostic game engine for choice-based educational games
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Represents a piece of evidence collected during gameplay
 */
export interface EvidenceItem {
    id: string;
    title: string;
    description: string;
    category: string;
    collectedAtScene: number;
    timestamp: number;
}

/**
 * Player skills (0–100). Good decisions increase; repeated mistakes decrease.
 */
export interface PlayerSkills {
    /** Detecting unsafe networks */
    wifiAwareness: number;
    /** Spotting fake messages & links */
    phishingAwareness: number;
    /** Handling banking / UPI alerts */
    paymentSafety: number;
}

/**
 * Represents a choice option presented to the player
 */
export interface SceneOption {
    id: string;
    text: string;
    riskDelta: number;
    nextScene: number;
    evidence?: EvidenceItem;
    flagsToSet?: Record<string, boolean>;
    actionLabel: string;
    /** System message shown after this choice (delayed feedback) */
    systemMessage?: string;
    /** Threat to create when this choice is selected */
    threatToAdd?: {
        id: string;
        type: ThreatType;
        severity?: ThreatSeverity;
    };
    /** ID of threat to resolve when this choice is selected */
    threatToResolve?: string;
    /** Skill gains when this (good) choice is selected */
    skillGain?: Partial<PlayerSkills>;
    /** Skill losses when this (bad) choice is selected */
    skillLoss?: Partial<PlayerSkills>;
    /** Immediate financial loss to apply */
    immediateLoss?: {
        amount: number;
        reason: string;
    };
    /** Scheduled financial loss (delayed consequence) */
    scheduledLoss?: {
        amount: number;
        reason: string;
        triggerAfterScenes?: number;
    };
}

/**
 * Represents a pending financial loss that will be applied after a delay
 */
export interface PendingLoss {
    amount: number;
    reason: string;
    triggerAfterScenes?: number;
    scheduledAtScene: number; // Scene progression count when loss was scheduled
}

/**
 * Represents a historical record of a financial loss
 */
export interface LossHistoryEntry {
    amount: number;
    reason: string;
    sceneId: number;
}

/**
 * Threat severity levels
 */
export type ThreatSeverity = "low" | "medium" | "high";

/**
 * Threat type identifiers
 */
export type ThreatType = "session_hijack" | "credential_leak" | "device_tracked" | string;

/**
 * Represents an active security threat that persists across scenes
 */
export interface ActiveThreat {
    id: string;
    type: ThreatType;
    severity: ThreatSeverity;
    sourceScene: number; // Scene ID where threat was created
    resolved: boolean;
    createdAt: number; // Timestamp when threat was created
    createdAtSceneProgression: number; // Scene progression count when threat was created (for escalation tracking)
}

/**
 * Represents the complete game state at any point in time
 */
export interface GameState {
    currentScene: number;
    riskScore: number;
    evidence: EvidenceItem[];
    actionsTaken: string[];
    flags: Record<string, boolean>;
    finished: boolean;
    /** Delayed feedback messages shown during gameplay */
    systemMessages: string[];
    /** Current account balance in rupees */
    balance: number;
    /** Financial losses scheduled to be applied in the future */
    pendingLosses: PendingLoss[];
    /** Historical record of all financial losses */
    lossHistory: LossHistoryEntry[];
    /** Active security threats that persist across scenes */
    activeThreats: ActiveThreat[];
    /** Player skills (0–100). Invisible during play; shown in end summary. */
    skills: PlayerSkills;
}

/**
 * Configuration for initializing a new game
 */
export interface GameConfig {
    startScene?: number;
    initialRiskScore?: number;
    initialFlags?: Record<string, boolean>;
    initialBalance?: number;
    initialSkills?: Partial<PlayerSkills>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a fresh initial game state
 * @param config - Optional configuration to customize initial state
 * @returns A new GameState object
 */
const DEFAULT_SKILLS: PlayerSkills = {
    wifiAwareness: 50,
    phishingAwareness: 50,
    paymentSafety: 50,
};

export function createInitialGameState(config: GameConfig = {}): GameState {
    const initialSkills = config.initialSkills
        ? { ...DEFAULT_SKILLS, ...config.initialSkills }
        : DEFAULT_SKILLS;
    return {
        currentScene: config.startScene ?? 0,
        riskScore: config.initialRiskScore ?? 0,
        evidence: [],
        actionsTaken: [],
        flags: config.initialFlags ?? {},
        finished: false,
        systemMessages: [],
        balance: config.initialBalance ?? 5000,
        pendingLosses: [],
        lossHistory: [],
        activeThreats: [],
        skills: initialSkills,
    };
}

/**
 * Default initial game state for quick usage
 */
export const initialGameState: GameState = createInitialGameState();

// ─────────────────────────────────────────────────────────────────────────────
// State Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deep clones a game state to ensure immutability
 * @param state - The state to clone
 * @returns A deep copy of the state
 */
export function cloneState(state: GameState): GameState {
    return {
        ...state,
        evidence: state.evidence.map((e) => ({ ...e })),
        actionsTaken: [...state.actionsTaken],
        flags: { ...state.flags },
        systemMessages: [...state.systemMessages],
        pendingLosses: state.pendingLosses.map((loss) => ({ ...loss })),
        lossHistory: state.lossHistory.map((entry) => ({ ...entry })),
        activeThreats: state.activeThreats.map((threat) => ({ ...threat })),
        skills: { ...state.skills },
    };
}

/**
 * Checks if a specific flag is set in the game state
 * @param state - Current game state
 * @param flagName - Name of the flag to check
 * @returns True if the flag exists and is true
 */
export function hasFlag(state: GameState, flagName: string): boolean {
    return state.flags[flagName] === true;
}

/**
 * Checks if specific evidence has been collected
 * @param state - Current game state
 * @param evidenceId - ID of the evidence to check
 * @returns True if evidence with given ID exists
 */
export function hasEvidence(state: GameState, evidenceId: string): boolean {
    return state.evidence.some((e) => e.id === evidenceId);
}

/**
 * Gets the count of evidence items in a specific category
 * @param state - Current game state
 * @param category - Category to count
 * @returns Number of evidence items in the category
 */
export function getEvidenceCountByCategory(
    state: GameState,
    category: string
): number {
    return state.evidence.filter((e) => e.category === category).length;
}
