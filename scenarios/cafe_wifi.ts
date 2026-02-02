/**
 * Café Wi-Fi Scenario
 * Beginner scenario - introduces first threat
 * Simple unsafe Wi-Fi connection with small consequences
 */

import type { SceneData } from "../components";
import { buildThreatAwareDescription } from "./scenarioHelpers";
import type { GameState } from "../engine/gameState";

/**
 * Builds the café Wi-Fi scenario scenes
 * This is the first scenario - introduces basic threat concepts
 */
export function buildCafeWifiScenes(state: GameState, startSceneId: number): SceneData[] {
    const sceneId = startSceneId;
    const nextSceneId = startSceneId + 1;
    const conclusionSceneId = startSceneId + 2;

    const cafe_Intro: SceneData = {
        id: sceneId,
        title: "Crowded Café",
        description: buildThreatAwareDescription(
            "You stop at a busy café to check messages and catch up on work. The place is packed, and you notice several people working on laptops. You need to connect to Wi-Fi to access your email.",
            state,
            []
        ),
        options: [
            {
                id: `cafe-${sceneId}-free-wifi`,
                text: "Connect to 'FREE_CAFE_WIFI' — No password, strong signal",
                riskDelta: 25,
                nextScene: nextSceneId,
                actionLabel: "Connect to open network",
                flagsToSet: { visitedCafe: true },
                systemMessage: "Connected to FREE_CAFE_WIFI... Network appears unsecured.",
                threatToAdd: {
                    id: "threat-cafe-session",
                    type: "session_hijack",
                    severity: "low",
                },
                immediateLoss: {
                    amount: 150,
                    reason: "Connected to unsecured café Wi-Fi - potential session interception",
                },
                skillLoss: { wifiAwareness: 3 },
            },
            {
                id: `cafe-${sceneId}-ask-password`,
                text: "Ask staff for the official Wi-Fi password",
                riskDelta: 5,
                nextScene: conclusionSceneId,
                actionLabel: "Use official network",
                evidence: {
                    id: "ev-cafe-official",
                    title: "Verified Official Network",
                    description: "You used the café's official password-protected network",
                    category: "Security Awareness",
                    collectedAtScene: sceneId,
                    timestamp: 0,
                },
                skillGain: { wifiAwareness: 5 },
            },
            {
                id: `cafe-${sceneId}-use-data`,
                text: "Use mobile data instead — safer but uses your data plan",
                riskDelta: 0,
                nextScene: conclusionSceneId,
                actionLabel: "Use cellular data",
                evidence: {
                    id: "ev-cafe-secure",
                    title: "Secure Connection Choice",
                    description: "You chose to use your own secure cellular connection",
                    category: "Best Practice",
                    collectedAtScene: sceneId,
                    timestamp: 0,
                },
                skillGain: { wifiAwareness: 5 },
            },
        ],
    };

    const cafe_Compromised: SceneData = {
        id: nextSceneId,
        title: "Something Feels Off",
        description: buildThreatAwareDescription(
            "You're browsing, but some websites are loading slowly. A few sites show certificate warnings. Your phone feels warmer than usual. You notice your battery draining faster.",
            state,
            [
                {
                    type: "session_hijack",
                    message: "Your previous session hijack threat is still active. The attacker may be monitoring this connection too.",
                },
            ]
        ),
        options: [
            {
                id: `cafe-${nextSceneId}-ignore`,
                text: "Ignore it — probably just a slow network",
                riskDelta: 20,
                nextScene: conclusionSceneId,
                actionLabel: "Continue using network",
                flagsToSet: { ignoredCafeWarning: true },
                systemMessage: "Multiple connection attempts detected from unknown devices...",
                scheduledLoss: {
                    amount: 400,
                    reason: "Ignored security warnings - data intercepted from café network",
                    triggerAfterScenes: 2,
                },
                skillLoss: { wifiAwareness: 4 },
            },
            {
                id: `cafe-${nextSceneId}-disconnect`,
                text: "Disconnect immediately and switch to mobile data",
                riskDelta: -5,
                nextScene: conclusionSceneId,
                actionLabel: "Disconnect and secure",
                evidence: {
                    id: "ev-cafe-disconnected",
                    title: "Recognized Threat Signs",
                    description: "You identified suspicious network behavior and disconnected",
                    category: "Security Awareness",
                    collectedAtScene: nextSceneId,
                    timestamp: 0,
                },
                threatToResolve: "threat-cafe-session",
                skillGain: { wifiAwareness: 6 },
            },
        ],
    };

    const cafe_Conclusion: SceneData = {
        id: conclusionSceneId,
        title: "Café Visit Complete",
        description: "You finish your work at the café. Time to head to your next destination.",
        options: [
            {
                id: `cafe-${conclusionSceneId}-continue`,
                text: "Continue to next location",
                riskDelta: 0,
                nextScene: -1, // Will be set by scenario composer
                actionLabel: "Leave café",
            },
        ],
    };

    return [cafe_Intro, cafe_Compromised, cafe_Conclusion];
}

export const CAFE_SCENARIO_ID = "cafe_wifi";
export const CAFE_SCENARIO_TITLE = "Crowded Café";
export const CAFE_SCENARIO_INTRO = "You stop at a café to check messages.";
