/**
 * Verdict Engine
 * Determines game outcomes based on player performance
 * Supports recovery-aware final outcome when recovery mode was used.
 */

import { GameState, type PlayerSkills } from "./gameState";
import { getSkills } from "./skillEngine";
import type { RecoveryOutcome } from "./recoveryEngine";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Skill summary for end-of-game display (not shown during gameplay).
 */
export interface SkillSummary {
    /** Final skill values (0–100). */
    skills: PlayerSkills;
    /** Human-readable feedback per skill (e.g. "Wi-Fi Awareness improved significantly."). */
    feedback: string[];
}

/**
 * Represents the final verdict/outcome of the game
 */
export interface Verdict {
    title: string;
    grade: VerdictGrade;
    explanationText: string;
    preventionTips: string[];
    score: number;
    maxScore: number;
    /** Shown only in end summary; never during gameplay. */
    skillSummary?: SkillSummary;
    /** When present, final summary shows incident + recovery analysis instead of simple grade. */
    recoveryOutcome?: RecoveryOutcome;
}

/**
 * Letter grades for verdict outcomes
 */
export type VerdictGrade = "S" | "A" | "B" | "C" | "D" | "F";

/**
 * Threshold configuration for verdict grades
 */
export interface VerdictThresholds {
    S: number; // Risk score <= this = S grade
    A: number;
    B: number;
    C: number;
    D: number;
    // Anything above D threshold = F grade
}

/**
 * Complete verdict configuration for a game
 */
export interface VerdictConfig {
    thresholds: VerdictThresholds;
    titles: Record<VerdictGrade, string>;
    explanations: Record<VerdictGrade, string>;
    preventionTips: Record<VerdictGrade, string[]>;
    maxScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default verdict configuration
 * Games can override this with custom configuration
 */
export const defaultVerdictConfig: VerdictConfig = {
    thresholds: {
        S: 10,
        A: 25,
        B: 40,
        C: 60,
        D: 80,
    },
    titles: {
        S: "Perfect Awareness",
        A: "Excellent Judgment",
        B: "Good Understanding",
        C: "Needs Improvement",
        D: "High Risk Taken",
        F: "Critical Failure",
    },
    explanations: {
        S: "Outstanding! You demonstrated exceptional awareness and made all the right choices to stay safe.",
        A: "Great job! You showed strong judgment and avoided most risky situations.",
        B: "Good effort! You understood the basics but missed a few important safety measures.",
        C: "You made several risky choices. Review the prevention tips to improve your awareness.",
        D: "You took significant risks that could have serious consequences. Please study the safety guidelines carefully.",
        F: "Critical failure. Your choices led to a dangerous outcome. It's essential to learn from this experience.",
    },
    preventionTips: {
        S: [
            "Keep maintaining your excellent awareness!",
            "Share your knowledge with others to help them stay safe.",
        ],
        A: [
            "Review any mistakes you made to achieve perfect awareness.",
            "Stay vigilant even when you feel confident.",
        ],
        B: [
            "Take more time to evaluate situations before making decisions.",
            "Learn to recognize red flags in ambiguous situations.",
            "Practice identifying potential risks in everyday scenarios.",
        ],
        C: [
            "Study the warning signs you missed during the game.",
            "Develop a habit of questioning unusual requests or offers.",
            "Consult trusted sources when uncertain about a situation.",
            "Never rush important decisions.",
        ],
        D: [
            "Immediately review all safety guidelines provided.",
            "Practice the scenarios again to build better instincts.",
            "Discuss your choices with someone knowledgeable.",
            "Create a personal checklist for evaluating risky situations.",
            "Remember: if something feels off, it probably is.",
        ],
        F: [
            "This is a critical learning opportunity - take it seriously.",
            "Go through all educational materials from the beginning.",
            "Seek guidance from experts or trusted advisors.",
            "Understand that these situations have real-world consequences.",
            "Never share personal information without verification.",
            "Always verify identities through official channels.",
        ],
    },
    maxScore: 100,
};

// ─────────────────────────────────────────────────────────────────────────────
// Core Verdict Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determines the grade based on risk score and thresholds
 * 
 * @param riskScore - Player's accumulated risk score
 * @param thresholds - Grade threshold configuration
 * @returns The appropriate grade
 */
export function calculateGrade(
    riskScore: number,
    thresholds: VerdictThresholds
): VerdictGrade {
    if (riskScore <= thresholds.S) return "S";
    if (riskScore <= thresholds.A) return "A";
    if (riskScore <= thresholds.B) return "B";
    if (riskScore <= thresholds.C) return "C";
    if (riskScore <= thresholds.D) return "D";
    return "F";
}

/**
 * Calculates the final score (inverse of risk - higher is better)
 * 
 * @param riskScore - Player's accumulated risk score
 * @param maxScore - Maximum possible score
 * @returns Calculated score (0 to maxScore)
 */
export function calculateScore(riskScore: number, maxScore: number): number {
    return Math.max(0, maxScore - riskScore);
}

/**
 * Generates a complete verdict based on the game state
 * When recoveryOutcome is provided, title/explanation/preventionTips are derived from it for the Final Summary.
 *
 * @param state - Final game state
 * @param config - Verdict configuration (uses defaults if not provided)
 * @param recoveryOutcome - Optional recovery outcome (when player went through recovery mode)
 * @returns Complete Verdict object
 */
const INITIAL_SKILL = 50;

function buildSkillSummary(state: GameState): SkillSummary {
    const skills = getSkills(state);
    const feedback: string[] = [];

    if (skills.wifiAwareness >= 70) {
        feedback.push("Your Wi-Fi Awareness improved significantly.");
    } else if (skills.wifiAwareness <= 35) {
        feedback.push("Wi-Fi Awareness needs improvement — practice spotting unsafe networks.");
    } else if (skills.wifiAwareness > INITIAL_SKILL) {
        feedback.push("Your Wi-Fi Awareness improved.");
    }

    if (skills.phishingAwareness >= 70) {
        feedback.push("Your Phishing Awareness improved significantly.");
    } else if (skills.phishingAwareness <= 35) {
        feedback.push("Phishing Awareness needs improvement — look for red flags in messages and links.");
    } else if (skills.phishingAwareness > INITIAL_SKILL) {
        feedback.push("Your Phishing Awareness improved.");
    }

    if (skills.paymentSafety >= 70) {
        feedback.push("Your Payment Safety improved significantly.");
    } else if (skills.paymentSafety <= 35) {
        feedback.push("Payment Safety needs improvement — verify alerts and avoid panic decisions.");
    } else if (skills.paymentSafety > INITIAL_SKILL) {
        feedback.push("Your Payment Safety improved.");
    }

    return { skills, feedback };
}

export function generateVerdict(
    state: GameState,
    config: VerdictConfig = defaultVerdictConfig,
    recoveryOutcome?: RecoveryOutcome
): Verdict {
    const grade = calculateGrade(state.riskScore, config.thresholds);
    const score = calculateScore(state.riskScore, config.maxScore);
    const skillSummary = buildSkillSummary(state);

    if (recoveryOutcome) {
        return {
            title: recoveryOutcome.title,
            grade,
            explanationText: recoveryOutcome.explanation,
            preventionTips: recoveryOutcome.advice,
            score,
            maxScore: config.maxScore,
            skillSummary,
            recoveryOutcome,
        };
    }

    return {
        title: config.titles[grade],
        grade,
        explanationText: config.explanations[grade],
        preventionTips: config.preventionTips[grade],
        score,
        maxScore: config.maxScore,
        skillSummary,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended Verdict Features
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extended verdict with additional analytics
 */
export interface ExtendedVerdict extends Verdict {
    actionsAnalysis: ActionAnalysis;
    evidenceAnalysis: EvidenceAnalysis;
    improvementAreas: string[];
}

/**
 * Analysis of player actions
 */
export interface ActionAnalysis {
    totalActions: number;
    riskyActions: number;
    safeActions: number;
    riskRatio: number;
}

/**
 * Analysis of collected evidence
 */
export interface EvidenceAnalysis {
    totalCollected: number;
    categoryCounts: Record<string, number>;
    missedEvidence: number;
}

/**
 * Generates an extended verdict with detailed analytics
 * 
 * @param state - Final game state
 * @param config - Verdict configuration
 * @param totalPossibleEvidence - Total evidence items available in the game
 * @param riskyActionLabels - Labels that indicate risky choices
 * @returns Extended verdict with full analysis
 */
export function generateExtendedVerdict(
    state: GameState,
    config: VerdictConfig = defaultVerdictConfig,
    totalPossibleEvidence: number = 0,
    riskyActionLabels: string[] = []
): ExtendedVerdict {
    const baseVerdict = generateVerdict(state, config);

    // Analyze actions
    const riskyActions = state.actionsTaken.filter((action) =>
        riskyActionLabels.some((label) =>
            action.toLowerCase().includes(label.toLowerCase())
        )
    ).length;

    const actionsAnalysis: ActionAnalysis = {
        totalActions: state.actionsTaken.length,
        riskyActions,
        safeActions: state.actionsTaken.length - riskyActions,
        riskRatio:
            state.actionsTaken.length > 0
                ? riskyActions / state.actionsTaken.length
                : 0,
    };

    // Analyze evidence
    const categoryCounts: Record<string, number> = {};
    for (const evidence of state.evidence) {
        categoryCounts[evidence.category] =
            (categoryCounts[evidence.category] || 0) + 1;
    }

    const evidenceAnalysis: EvidenceAnalysis = {
        totalCollected: state.evidence.length,
        categoryCounts,
        missedEvidence: Math.max(0, totalPossibleEvidence - state.evidence.length),
    };

    // Generate improvement areas based on analysis
    const improvementAreas: string[] = [];
    if (actionsAnalysis.riskRatio > 0.5) {
        improvementAreas.push("Reduce risky decision-making");
    }
    if (evidenceAnalysis.missedEvidence > 0) {
        improvementAreas.push(
            `Collect more evidence (${evidenceAnalysis.missedEvidence} missed)`
        );
    }
    if (state.riskScore > config.thresholds.B) {
        improvementAreas.push("Focus on safer choices early in the game");
    }

    return {
        ...baseVerdict,
        actionsAnalysis,
        evidenceAnalysis,
        improvementAreas,
    };
}

/**
 * Creates a text summary of the verdict suitable for display
 * 
 * @param verdict - The verdict to summarize
 * @returns Formatted text summary
 */
export function formatVerdictSummary(verdict: Verdict): string {
    const lines = [
        `═══════════════════════════════════════`,
        `  ${verdict.title}`,
        `  Grade: ${verdict.grade} | Score: ${verdict.score}/${verdict.maxScore}`,
        `═══════════════════════════════════════`,
        ``,
        verdict.explanationText,
        ``,
        `Prevention Tips:`,
        ...verdict.preventionTips.map((tip) => `  • ${tip}`),
    ];

    return lines.join("\n");
}
