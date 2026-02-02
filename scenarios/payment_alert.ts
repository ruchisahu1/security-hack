/**
 * Payment Alert Scenario
 * Advanced scenario - fake UPI/bank alert with panic decisions
 * Large losses possible, reacts to all existing threats
 */

import type { SceneData } from "../components";
import { buildThreatAwareDescription } from "./scenarioHelpers";
import { hasActiveThreat, getActiveThreats, getThreatsBySeverity } from "../engine/threatEngine";
import type { GameState } from "../engine/gameState";

/**
 * Builds the payment alert scenario scenes
 * This scenario creates panic and large losses, especially if threats exist
 */
export function buildPaymentAlertScenes(state: GameState, startSceneId: number): SceneData[] {
    const sceneId = startSceneId;
    const alertSceneId = startSceneId + 1;
    const panicSceneId = startSceneId + 2;
    const conclusionSceneId = startSceneId + 3;

    // Check for existing threats
    const hasCredentialLeak = hasActiveThreat(state, "credential_leak");
    const hasSessionHijack = hasActiveThreat(state, "session_hijack");
    const hasDeviceTracked = hasActiveThreat(state, "device_tracked");
    const highSeverityThreats = getThreatsBySeverity(state, "high");
    const activeThreats = getActiveThreats(state);
    const threatCount = activeThreats.length;

    // Calculate base loss multiplier based on threats
    const threatMultiplier = 1 + (threatCount * 0.3) + (highSeverityThreats.length * 0.5);

    const payment_Intro: SceneData = {
        id: sceneId,
        title: "Payment Alert",
        description: buildThreatAwareDescription(
            "You receive an urgent SMS alert: 'URGENT: ₹5,000 debited from your account. Transaction ID: TXN789456. If unauthorized, call immediately: 1800-XXX-XXXX'",
            state,
            [
                {
                    type: "credential_leak",
                    message: "⚠️ CRITICAL: You have an active credential leak threat. This could be related!",
                },
                {
                    type: "session_hijack",
                    message: "⚠️ CRITICAL: Your session hijack threat is still active. This transaction may be real!",
                },
            ]
        ),
        attackerNarration: hasCredentialLeak || hasSessionHijack
            ? "Perfect timing! Using compromised credentials/session to create fake alert. Victim will panic and call fake number, giving us more access."
            : "Sending fake payment alert SMS. Using urgency and fear to trick victim into calling fake support number.",
        timer: {
            duration: 16,
            defaultOptionIndex: 0, // Default to panic call
        },
        options: [
            {
                id: `payment-${sceneId}-panic-call`,
                text: "Call the number immediately — this is urgent!",
                riskDelta: hasCredentialLeak || hasSessionHijack ? 60 : 50,
                nextScene: panicSceneId,
                actionLabel: "Call support number",
                flagsToSet: { calledFakeSupport: true },
                skillLoss: { paymentSafety: 5, phishingAwareness: 3 },
                systemMessage: hasCredentialLeak || hasSessionHijack
                    ? "Calling support... Your compromised credentials may be used during verification."
                    : "Calling support number from SMS...",
                immediateLoss: {
                    amount: Math.round(300 * threatMultiplier),
                    reason: "Called fake support number - provided verification details",
                },
                threatToAdd: {
                    id: "threat-payment-scam",
                    type: "credential_leak",
                    severity: hasCredentialLeak ? "high" : "medium",
                },
                scheduledLoss: {
                    amount: Math.round(2000 * threatMultiplier),
                    reason: hasCredentialLeak || hasSessionHijack
                        ? "Payment scam + existing threats - attacker used compromised access for large transaction"
                        : "Payment scam - unauthorized transaction after providing verification",
                    triggerAfterScenes: 1,
                },
            },
            {
                id: `payment-${sceneId}-check-app`,
                text: "Check your banking app first to verify the transaction",
                riskDelta: 0,
                nextScene: alertSceneId,
                actionLabel: "Verify in app",
                evidence: {
                    id: "ev-payment-verified",
                    title: "Verified Transaction",
                    description: "You checked the official app before taking action",
                    category: "Best Practice",
                    collectedAtScene: sceneId,
                    timestamp: 0,
                },
                skillGain: { paymentSafety: 6, phishingAwareness: 4 },
            },
            {
                id: `payment-${sceneId}-ignore`,
                text: "Ignore it — probably spam",
                riskDelta: hasCredentialLeak || hasSessionHijack ? 40 : 20,
                nextScene: conclusionSceneId,
                actionLabel: "Ignore alert",
                flagsToSet: { ignoredPaymentAlert: true },
                systemMessage: hasCredentialLeak || hasSessionHijack
                    ? "Ignoring alert... But your existing threats mean this could be a real unauthorized transaction."
                    : "Ignoring alert...",
                scheduledLoss: hasCredentialLeak || hasSessionHijack
                    ? {
                          amount: Math.round(1500 * threatMultiplier),
                          reason: "Ignored payment alert - existing threats used for unauthorized transaction",
                          triggerAfterScenes: 2,
                      }
                    : undefined,
            },
        ],
    };

    const payment_AlertCheck: SceneData = {
        id: alertSceneId,
        title: "Checking Banking App",
        description: buildThreatAwareDescription(
            "You open your banking app. The transaction doesn't appear in your recent transactions. The SMS number doesn't match your bank's official support number. This looks like a phishing attempt.",
            state,
            [
                {
                    type: "session_hijack",
                    message: "However, your session hijack threat means an attacker could still access your account.",
                },
            ]
        ),
        attackerNarration: "Victim checked app. They're being cautious. But if they have active session hijack, we can still access their account.",
        options: [
            {
                id: `payment-${alertSceneId}-report`,
                text: "Report this as phishing to your bank",
                riskDelta: -5,
                nextScene: conclusionSceneId,
                actionLabel: "Report phishing",
                evidence: {
                    id: "ev-payment-reported",
                    title: "Reported Phishing Attempt",
                    description: "You identified and reported a fake payment alert",
                    category: "Security Awareness",
                    collectedAtScene: alertSceneId,
                    timestamp: 0,
                },
                // Resolve threats if reporting properly
                threatToResolve: hasSessionHijack ? "threat-cafe-session" : undefined,
                immediateLoss: {
                    amount: 0,
                    reason: "No loss - correctly identified phishing attempt",
                },
            },
            {
                id: `payment-${alertSceneId}-still-worry`,
                text: "Still worried — call your bank's official number from their website",
                riskDelta: 0,
                nextScene: conclusionSceneId,
                actionLabel: "Call official support",
                evidence: {
                    id: "ev-payment-official-call",
                    title: "Contacted Official Support",
                    description: "You used the bank's official number to verify",
                    category: "Best Practice",
                    collectedAtScene: alertSceneId,
                    timestamp: 0,
                },
                threatToResolve: hasSessionHijack ? "threat-cafe-session" : undefined,
                immediateLoss: {
                    amount: 0,
                    reason: "No loss - used official support channel",
                },
            },
        ],
    };

    const payment_PanicCall: SceneData = {
        id: panicSceneId,
        title: "On the Phone",
        description: buildThreatAwareDescription(
            "A person answers claiming to be from bank security. They sound urgent and ask you to verify your identity by providing your account number, last 4 digits of your card, and OTP they'll send. They say they need to 'reverse the transaction immediately'.",
            state,
            [
                {
                    type: "credential_leak",
                    message: "⚠️ Your existing credential leak threat means they may already have some of your information!",
                },
            ]
        ),
        attackerNarration: hasCredentialLeak
            ? "SUCCESS! Victim called fake number. We already have their credentials from previous attack. Now getting OTP to complete the scam."
            : "Victim called! They're panicking. Getting them to provide verification details and OTP.",
        timer: {
            duration: 18,
            defaultOptionIndex: 0,
        },
        options: [
            {
                id: `payment-${panicSceneId}-provide-details`,
                text: "Provide the details — they need to reverse the transaction fast",
                riskDelta: 70,
                nextScene: conclusionSceneId,
                actionLabel: "Provide verification",
                flagsToSet: { providedScamDetails: true },
                systemMessage: hasCredentialLeak
                    ? "Verification details provided... Attacker now has complete account access using your leaked credentials."
                    : "Verification details provided... Account may be compromised.",
                immediateLoss: {
                    amount: Math.round(500 * threatMultiplier),
                    reason: "Provided verification details to fake support",
                },
                threatToAdd: {
                    id: "threat-payment-complete-scam",
                    type: "credential_leak",
                    severity: "high",
                },
                scheduledLoss: {
                    amount: Math.round(3000 * threatMultiplier),
                    reason: hasCredentialLeak || hasSessionHijack
                        ? "Complete account compromise - attacker used all available threats for maximum damage"
                        : "Account compromised - large unauthorized transaction",
                    triggerAfterScenes: 0, // Immediate
                },
            },
            {
                id: `payment-${panicSceneId}-hang-up`,
                text: "Hang up and call your bank's official number instead",
                riskDelta: -10,
                nextScene: conclusionSceneId,
                actionLabel: "End call and verify",
                evidence: {
                    id: "ev-payment-caught-scam",
                    title: "Caught Scam Attempt",
                    description: "You recognized the scam and contacted official support",
                    category: "Security Awareness",
                    collectedAtScene: panicSceneId,
                    timestamp: 0,
                },
                skillGain: { paymentSafety: 8, phishingAwareness: 6 },
                immediateLoss: {
                    amount: Math.round(100 * threatMultiplier),
                    reason: "Small loss from initial fake transaction (if real threat existed)",
                },
            },
            {
                id: `payment-${panicSceneId}-verify-first`,
                text: "Ask them to verify they're from the bank first",
                riskDelta: 5,
                nextScene: conclusionSceneId,
                actionLabel: "Request verification",
                evidence: {
                    id: "ev-payment-requested-verification",
                    title: "Requested Caller Verification",
                    description: "You asked for proof before providing details",
                    category: "Security Awareness",
                    collectedAtScene: panicSceneId,
                    timestamp: 0,
                },
                immediateLoss: {
                    amount: Math.round(200 * threatMultiplier),
                    reason: "Partial information may have been shared",
                },
            },
        ],
    };

    const payment_Conclusion: SceneData = {
        id: conclusionSceneId,
        title: "Alert Resolved",
        description: buildThreatAwareDescription(
            "You've handled the payment alert situation. Whether it was real or fake, you've taken action.",
            state,
            []
        ),
        options: [
            {
                id: `payment-${conclusionSceneId}-continue`,
                text: "Continue",
                riskDelta: 0,
                nextScene: -1, // End or next scenario
                actionLabel: "Continue",
            },
        ],
    };

    return [payment_Intro, payment_AlertCheck, payment_PanicCall, payment_Conclusion];
}

export const PAYMENT_SCENARIO_ID = "payment_alert";
export const PAYMENT_SCENARIO_TITLE = "Payment Alert";
export const PAYMENT_SCENARIO_INTRO = "You receive an urgent payment alert SMS.";
