/**
 * Airport Wi-Fi Scenario
 * Intermediate scenario - reacts to and escalates existing threats
 * Time pressure + look-alike networks + threat escalation
 */

import type { SceneData } from "../components";
import { buildThreatAwareDescription } from "./scenarioHelpers";
import { hasActiveThreat, getActiveThreats } from "../engine/threatEngine";
import type { GameState } from "../engine/gameState";

/**
 * Builds the airport Wi-Fi scenario scenes
 * This scenario escalates threats from previous scenarios
 */
export function buildAirportWifiScenes(state: GameState, startSceneId: number): SceneData[] {
    const sceneId = startSceneId;
    const fakeNetworkSceneId = startSceneId + 1;
    const safeNetworkSceneId = startSceneId + 2;
    const conclusionSceneId = startSceneId + 3;

    // Check for existing threats to customize description
    const hasSessionThreat = hasActiveThreat(state, "session_hijack");
    const activeThreats = getActiveThreats(state);
    const threatCount = activeThreats.length;

    // Build dynamic description based on existing threats
    let airportDescription = "You've arrived at the airport. Your flight is boarding in 20 minutes. You urgently need to check your email and make a hotel booking payment. Multiple Wi-Fi networks are available.";
    
    if (hasSessionThreat) {
        airportDescription += "\n\n⚠️ You remember connecting to an unsecured network earlier. Your session may still be compromised.";
    }
    
    if (threatCount > 0) {
        airportDescription += `\n\n⚠️ You have ${threatCount} active security threat${threatCount > 1 ? 's' : ''} from previous connections.`;
    }

    const airport_Arrival: SceneData = {
        id: sceneId,
        title: "Airport Terminal",
        description: airportDescription,
        attackerNarration: hasSessionThreat
            ? "Previous session hijack detected. Attacker is monitoring this device. Setting up evil twin hotspot to escalate the attack."
            : "Attacker has set up a rogue access point named 'FREE_AIRPORT_WIFI' near the terminal. The evil twin hotspot is broadcasting with maximum signal strength, waiting for victims to connect.",
        options: [
            {
                id: `airport-${sceneId}-free-wifi`,
                text: "Connect to 'FREE_AIRPORT_WIFI' — No password required, strong signal",
                riskDelta: hasSessionThreat ? 40 : 30, // Higher risk if already compromised
                nextScene: fakeNetworkSceneId,
                actionLabel: "Connect to open network",
                flagsToSet: { connectedToFakeNetwork: true, visitedAirport: true },
                systemMessage: hasSessionThreat
                    ? "Connected to FREE_AIRPORT_WIFI... Previous session hijack detected. Attack escalating."
                    : "Connected to FREE_AIRPORT_WIFI... Network traffic routing detected.",
                threatToAdd: hasSessionThreat
                    ? undefined // Don't create new threat, will escalate existing
                    : {
                          id: "threat-airport-session",
                          type: "session_hijack",
                          severity: "low",
                      },
                immediateLoss: {
                    amount: hasSessionThreat ? 300 : 200,
                    reason: hasSessionThreat
                        ? "Connected to fake airport Wi-Fi - existing session hijack escalated"
                        : "Connected to unsecured airport network - potential data interception",
                },
                skillLoss: { wifiAwareness: 4 },
                // Escalate existing session hijack threat if present
                scheduledLoss: hasSessionThreat
                    ? {
                          amount: 1200,
                          reason: "Session hijack escalated - attacker used compromised session during airport login",
                          triggerAfterScenes: 1,
                      }
                    : undefined,
            },
            {
                id: `airport-${sceneId}-official`,
                text: "Connect to 'Airport_Guest_5G' — Requires SMS verification",
                riskDelta: 5,
                nextScene: safeNetworkSceneId,
                actionLabel: "Use verified network",
                evidence: {
                    id: "ev-airport-sms-verification",
                    title: "SMS Verification Required",
                    description: "The network uses phone verification, a sign of legitimacy",
                    category: "Security Awareness",
                    collectedAtScene: sceneId,
                    timestamp: 0,
                },
            },
            {
                id: `airport-${sceneId}-mobile-data`,
                text: "Turn on mobile data roaming — costs extra but you control it",
                riskDelta: 0,
                nextScene: safeNetworkSceneId,
                actionLabel: "Use cellular data",
                evidence: {
                    id: "ev-airport-own-connection",
                    title: "Private Connection",
                    description: "You chose to use your own secure cellular connection",
                    category: "Best Practice",
                    collectedAtScene: sceneId,
                    timestamp: 0,
                },
                // Resolve existing threats if using secure connection
                threatToResolve: hasSessionThreat ? "threat-cafe-session" : undefined,
            },
            {
                id: `airport-${sceneId}-ask-info`,
                text: "Ask airport information desk about the official WiFi",
                riskDelta: 0,
                nextScene: safeNetworkSceneId,
                actionLabel: "Verify with staff",
                evidence: {
                    id: "ev-airport-verified-network",
                    title: "Verified Official Network",
                    description: "You confirmed the legitimate network name with airport staff",
                    category: "Security Awareness",
                    collectedAtScene: sceneId,
                    timestamp: 0,
                },
            },
        ],
    };

    const airport_FakeNetwork: SceneData = {
        id: fakeNetworkSceneId,
        title: "Connected to Suspicious Network",
        description: buildThreatAwareDescription(
            "You're connected! But a login page pops up asking you to 'verify your identity' by entering your email address and creating a password. The page looks suspicious — the logo seems blurry and there are typos.",
            state,
            [
                {
                    type: "session_hijack",
                    message: "Your previous session hijack is still active. The attacker is likely monitoring this connection too.",
                },
            ]
        ),
        attackerNarration: hasSessionThreat
            ? "SUCCESS! Victim connected again. Using previous session hijack to escalate attack. Credentials will be captured and previous session will be used for unauthorized access."
            : "Victim connected! Serving captive portal phishing page. Keylogger active. All HTTP traffic is being captured and analyzed in real-time.",
        timer: {
            duration: 14,
            defaultOptionIndex: 1,
        },
        options: [
            {
                id: `airport-${fakeNetworkSceneId}-enter-real`,
                text: "Enter your main email and a password you commonly use",
                riskDelta: hasSessionThreat ? 50 : 45,
                nextScene: conclusionSceneId,
                actionLabel: "Submit real credentials",
                flagsToSet: { sharedRealCredentials: true },
                systemMessage: hasSessionThreat
                    ? "Form submission intercepted... Previous session hijack used to access your accounts immediately."
                    : "Form submission intercepted... Credentials captured by unknown server.",
                threatToAdd: {
                    id: "threat-airport-credential-leak",
                    type: "credential_leak",
                    severity: hasSessionThreat ? "high" : "medium",
                },
                immediateLoss: {
                    amount: hasSessionThreat ? 800 : 500,
                    reason: hasSessionThreat
                        ? "Real credentials submitted - attacker used existing session hijack for immediate access"
                        : "Real credentials submitted to phishing portal",
                },
                scheduledLoss: {
                    amount: hasSessionThreat ? 2000 : 800,
                    reason: hasSessionThreat
                        ? "Credential leak + session hijack - unauthorized account access and transactions"
                        : "Credential leak - unauthorized account access detected",
                    triggerAfterScenes: hasSessionThreat ? 0 : 2,
                },
            },
            {
                id: `airport-${fakeNetworkSceneId}-enter-fake`,
                text: "Enter a fake email and random password just to get through",
                riskDelta: 15,
                nextScene: safeNetworkSceneId,
                actionLabel: "Submit fake credentials",
                evidence: {
                    id: "ev-airport-fake-creds",
                    title: "Used Disposable Credentials",
                    description: "You avoided sharing real information with a suspicious portal",
                    category: "Smart Move",
                    collectedAtScene: fakeNetworkSceneId,
                    timestamp: 0,
                },
                systemMessage: "Connection established... Some traffic may be monitored.",
            },
            {
                id: `airport-${fakeNetworkSceneId}-disconnect`,
                text: "This looks suspicious — disconnect immediately",
                riskDelta: -10,
                nextScene: safeNetworkSceneId,
                actionLabel: "Disconnect and find alternative",
                evidence: {
                    id: "ev-airport-spotted-phishing",
                    title: "Recognized Phishing Attempt",
                    description: "You identified signs of a fake login portal and avoided it",
                    category: "Security Awareness",
                    collectedAtScene: fakeNetworkSceneId,
                    timestamp: 0,
                },
                threatToResolve: "threat-airport-session",
                skillGain: { wifiAwareness: 5, phishingAwareness: 5 },
            },
        ],
    };

    const airport_SafeNetwork: SceneData = {
        id: safeNetworkSceneId,
        title: "Connected Securely",
        description: buildThreatAwareDescription(
            "You're now on a legitimate network. Your connection is stable. You open your browser to check your email and make that hotel payment.",
            state,
            [
                {
                    type: "session_hijack",
                    message: "However, your previous session hijack threat is still active. Be extra careful with sensitive operations.",
                },
            ]
        ),
        attackerNarration: hasSessionThreat
            ? "Target is on legitimate network, but previous session hijack still active. Monitoring for opportunities to use compromised session."
            : "Target disconnected or never connected. No credentials harvested from this victim. Moving on to scan for other targets.",
        options: [
            {
                id: `airport-${safeNetworkSceneId}-check-https`,
                text: "First verify the URL shows 'https://' and the correct domain",
                riskDelta: 0,
                nextScene: conclusionSceneId,
                actionLabel: "Verify secure connection",
                evidence: {
                    id: "ev-airport-https-check",
                    title: "Verified HTTPS",
                    description: "You checked for secure connection before entering sensitive data",
                    category: "Best Practice",
                    collectedAtScene: safeNetworkSceneId,
                    timestamp: 0,
                },
            },
            {
                id: `airport-${safeNetworkSceneId}-proceed`,
                text: "The page looks normal — proceed to log in",
                riskDelta: hasSessionThreat ? 20 : 10,
                nextScene: conclusionSceneId,
                actionLabel: "Login without verification",
                systemMessage: hasSessionThreat
                    ? "Proceeding without URL verification... Previous session hijack may compromise this login."
                    : "Proceeding without URL verification...",
                scheduledLoss: hasSessionThreat
                    ? {
                          amount: 600,
                          reason: "Login on compromised session - attacker may intercept credentials",
                          triggerAfterScenes: 1,
                      }
                    : undefined,
            },
            {
                id: `airport-${safeNetworkSceneId}-use-app`,
                text: "Use your bank's official mobile app instead of the website",
                riskDelta: 0,
                nextScene: conclusionSceneId,
                actionLabel: "Use official app",
                evidence: {
                    id: "ev-airport-used-app",
                    title: "Used Official App",
                    description: "Mobile apps are harder to spoof than websites",
                    category: "Best Practice",
                    collectedAtScene: safeNetworkSceneId,
                    timestamp: 0,
                },
                // Resolve threats when using secure app
                threatToResolve: hasSessionThreat ? "threat-cafe-session" : undefined,
            },
        ],
    };

    const airport_Conclusion: SceneData = {
        id: conclusionSceneId,
        title: "Airport Complete",
        description: "You finish your tasks at the airport. Time to board your flight or head to your next destination.",
        options: [
            {
                id: `airport-${conclusionSceneId}-continue`,
                text: "Continue to next location",
                riskDelta: 0,
                nextScene: -1, // Will be set by scenario composer
                actionLabel: "Leave airport",
            },
        ],
    };

    return [airport_Arrival, airport_FakeNetwork, airport_SafeNetwork, airport_Conclusion];
}

export const AIRPORT_SCENARIO_ID = "airport_wifi";
export const AIRPORT_SCENARIO_TITLE = "Airport Terminal";
export const AIRPORT_SCENARIO_INTRO = "You've arrived at the airport. Your flight is boarding soon.";
