/**
 * Game Engine - Main Entry Point
 * Exports all engine modules for clean imports
 */

// ─────────────────────────────────────────────────────────────────────────────
// Game State
// ─────────────────────────────────────────────────────────────────────────────
export {
    // Types
    type GameState,
    type EvidenceItem,
    type SceneOption,
    type GameConfig,
    type PendingLoss,
    type LossHistoryEntry,
    type ActiveThreat,
    type ThreatSeverity,
    type ThreatType,
    type PlayerSkills,
    // State Factory
    createInitialGameState,
    initialGameState,
    // Utilities
    cloneState,
    hasFlag,
    hasEvidence,
    getEvidenceCountByCategory,
} from "./gameState";

// ─────────────────────────────────────────────────────────────────────────────
// Choice Engine
// ─────────────────────────────────────────────────────────────────────────────
export {
    // Types
    type ChoiceResult,
    type ApplyChoiceOptions,
    // Core Functions
    applyChoice,
    applyChoiceSequence,
    // Utilities
    wouldChoiceEndGame,
    filterAvailableChoices,
} from "./applyChoice";

// ─────────────────────────────────────────────────────────────────────────────
// Verdict Engine
// ─────────────────────────────────────────────────────────────────────────────
export {
    // Types
    type Verdict,
    type SkillSummary,
    type VerdictGrade,
    type VerdictThresholds,
    type VerdictConfig,
    type ExtendedVerdict,
    type ActionAnalysis,
    type EvidenceAnalysis,
    // Configuration
    defaultVerdictConfig,
    // Core Functions
    calculateGrade,
    calculateScore,
    generateVerdict,
    generateExtendedVerdict,
    formatVerdictSummary,
} from "./verdictEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Economy Engine
// ─────────────────────────────────────────────────────────────────────────────
export {
    // Types
    type ImmediateLossOptions,
    type ScheduledLossOptions,
    // Core Functions
    applyImmediateLoss,
    scheduleLoss,
    resolvePendingLosses,
    // Utilities
    getTotalPendingLosses,
    getMostRecentLoss,
} from "./economyEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Threat Engine
// ─────────────────────────────────────────────────────────────────────────────
export {
    // Types
    type ThreatOptions,
    type EscalationConfig,
    // Core Functions
    addThreat,
    escalateThreats,
    resolveThreat,
    // Utilities
    getActiveThreatCount,
    getActiveThreats,
    getThreatsBySeverity,
    hasActiveThreat,
} from "./threatEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Skill Engine
// ─────────────────────────────────────────────────────────────────────────────
export {
    // Core Functions
    increaseSkill,
    decreaseSkill,
    applySkillGains,
    applySkillLosses,
    // Effect Hooks (for threat/economy integration)
    getEscalationDelayBonus,
    getLossMultiplier,
    getTimerBonusSeconds,
    getSkills,
} from "./skillEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Recovery Engine
// ─────────────────────────────────────────────────────────────────────────────
export {
    // Types
    type RecoveryActionDef,
    type RecoveryActionResult,
    type RecoverySnapshot,
    type RecoveryOutcome,
    type RecoveryOutcomeType,
    type ApplyRecoveryOptions,
    // Data
    RECOVERY_ACTIONS,
    // Core Functions
    shouldEnterRecovery,
    getTotalMoneyLost,
    getAvailableRecoveryActions,
    applyRecoveryAction,
    applyRecoveryActionWithTrackedRecovery,
    getRecoveryOutcome,
    createRecoverySnapshot,
} from "./recoveryEngine";
