/**
 * The Public Wi-Fi Trap - Case Definition
 * Educational scenario about public WiFi security risks
 * 
 * Enhanced with:
 * - System messages for delayed feedback
 * - Timer config for time-pressured decisions
 * - Attacker narrations for reveal view
 */

import type { CaseData, SceneData } from "../../../components";

// ─────────────────────────────────────────────────────────────────────────────
// Case Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const CASE_ID = "public-wifi-trap";
export const CASE_TITLE = "The Public Wi-Fi Trap";
export const CASE_DESCRIPTION =
    "You're traveling and need to get online urgently. But not every connection is what it seems. Can you spot the dangers lurking in public networks?";

// ─────────────────────────────────────────────────────────────────────────────
// Scene Definitions
// ─────────────────────────────────────────────────────────────────────────────

const scene0_AirportArrival: SceneData = {
    id: 0,
    title: "Airport Terminal",
    description:
        "You've just landed at the airport after a long flight. Your phone battery is at 15%, and you urgently need to check an important work email and transfer money for a hotel booking. You spot several available WiFi networks on your phone.",
    attackerNarration:
        "Attacker has set up a rogue access point named 'FREE_AIRPORT_WIFI' near the terminal. The evil twin hotspot is broadcasting with maximum signal strength, waiting for victims to connect.",
    options: [
        {
            id: "s0-free-airport",
            text: "Connect to 'FREE_AIRPORT_WIFI' — No password required, strong signal",
            riskDelta: 30,
            nextScene: 1,
            actionLabel: "Connect to open network",
            flagsToSet: { connectedToFakeNetwork: true },
            systemMessage: "Connected to FREE_AIRPORT_WIFI... Network traffic routing detected.",
            threatToAdd: {
                id: "threat-fake-network",
                type: "device_tracked",
                severity: "low",
            },
            immediateLoss: {
                amount: 100,
                reason: "Connected to unsecured network - potential data interception",
            },
        },
        {
            id: "s0-airport-official",
            text: "Connect to 'Airport_Guest_5G' — Requires SMS verification",
            riskDelta: 5,
            nextScene: 2,
            actionLabel: "Use verified network",
            evidence: {
                id: "ev-sms-verification",
                title: "SMS Verification Required",
                description: "The network uses phone verification, a sign of legitimacy",
                category: "Security Awareness",
                collectedAtScene: 0,
                timestamp: 0,
            },
        },
        {
            id: "s0-mobile-data",
            text: "Turn on mobile data roaming instead — It costs extra but you control it",
            riskDelta: 0,
            nextScene: 3,
            actionLabel: "Use cellular data",
            evidence: {
                id: "ev-own-connection",
                title: "Private Connection",
                description: "You chose to use your own secure cellular connection",
                category: "Best Practice",
                collectedAtScene: 0,
                timestamp: 0,
            },
        },
        {
            id: "s0-ask-info",
            text: "Ask airport information desk about the official WiFi",
            riskDelta: 0,
            nextScene: 2,
            actionLabel: "Verify with staff",
            evidence: {
                id: "ev-verified-network",
                title: "Verified Official Network",
                description: "You confirmed the legitimate network name with airport staff",
                category: "Security Awareness",
                collectedAtScene: 0,
                timestamp: 0,
            },
        },
    ],
};

const scene1_FakeNetwork: SceneData = {
    id: 1,
    title: "Connected to Suspicious Network",
    description:
        "You're connected! But a login page pops up asking you to 'verify your identity' by entering your email address and creating a password. The page looks a bit off — the logo seems blurry and there are some typos.",
    attackerNarration:
        "Victim connected! Serving captive portal phishing page. Keylogger active. All HTTP traffic is being captured and analyzed in real-time.",
    // Time pressure - 8 seconds to decide, defaults to entering fake credentials if no choice
    timer: {
        duration: 14,
        defaultOptionIndex: 1,
    },
    options: [
        {
            id: "s1-enter-real",
            text: "Enter your main email and a password you commonly use",
            riskDelta: 45,
            nextScene: 4,
            actionLabel: "Submit real credentials",
            flagsToSet: { sharedRealCredentials: true },
            systemMessage: "Form submission intercepted... Credentials captured by unknown server.",
            threatToAdd: {
                id: "threat-credential-leak",
                type: "credential_leak",
                severity: "medium",
            },
            immediateLoss: {
                amount: 500,
                reason: "Real credentials submitted to phishing portal",
            },
            scheduledLoss: {
                amount: 800,
                reason: "Credential leak - unauthorized account access detected",
                triggerAfterScenes: 2,
            },
        },
        {
            id: "s1-enter-fake",
            text: "Enter a fake email and random password just to get through",
            riskDelta: 15,
            nextScene: 5,
            actionLabel: "Submit fake credentials",
            evidence: {
                id: "ev-fake-creds",
                title: "Used Disposable Credentials",
                description: "You avoided sharing real information with a suspicious portal",
                category: "Smart Move",
                collectedAtScene: 1,
                timestamp: 0,
            },
            systemMessage: "Connection established... Some traffic may be monitored.",
        },
        {
            id: "s1-disconnect",
            text: "This looks suspicious — disconnect immediately",
            riskDelta: -10,
            nextScene: 2,
            actionLabel: "Disconnect and find alternative",
            evidence: {
                id: "ev-spotted-phishing",
                title: "Recognized Phishing Attempt",
                description: "You identified signs of a fake login portal and avoided it",
                category: "Security Awareness",
                collectedAtScene: 1,
                timestamp: 0,
            },
            threatToResolve: "threat-fake-network",
        },
    ],
};

const scene2_SafeNetwork: SceneData = {
    id: 2,
    title: "Connected Securely",
    description:
        "You're now on the legitimate airport network. Your connection is stable. You open your browser to check your bank account and make that hotel payment. The bank's website loads.",
    attackerNarration:
        "Target disconnected or never connected. No credentials harvested from this victim. Moving on to scan for other targets.",
    options: [
        {
            id: "s2-check-https",
            text: "First verify the URL shows 'https://' and the correct bank domain",
            riskDelta: 0,
            nextScene: 6,
            actionLabel: "Verify secure connection",
            evidence: {
                id: "ev-https-check",
                title: "Verified HTTPS",
                description: "You checked for secure connection before entering sensitive data",
                category: "Best Practice",
                collectedAtScene: 2,
                timestamp: 0,
            },
        },
        {
            id: "s2-proceed-directly",
            text: "The page looks normal — proceed to log in",
            riskDelta: 10,
            nextScene: 6,
            actionLabel: "Login without verification",
            systemMessage: "Proceeding without URL verification...",
        },
        {
            id: "s2-use-app",
            text: "Use your bank's official mobile app instead of the website",
            riskDelta: 0,
            nextScene: 6,
            actionLabel: "Use official app",
            evidence: {
                id: "ev-used-app",
                title: "Used Official App",
                description: "Mobile apps are harder to spoof than websites",
                category: "Best Practice",
                collectedAtScene: 2,
                timestamp: 0,
            },
        },
        {
            id: "s2-wait",
            text: "Wait until you reach a trusted network for banking",
            riskDelta: -5,
            nextScene: 7,
            actionLabel: "Delay sensitive activity",
            evidence: {
                id: "ev-delayed-sensitive",
                title: "Avoided Public WiFi Banking",
                description: "You chose not to perform sensitive transactions on public networks",
                category: "Best Practice",
                collectedAtScene: 2,
                timestamp: 0,
            },
        },
    ],
};

const scene3_CellularData: SceneData = {
    id: 3,
    title: "Using Mobile Data",
    description:
        "Your cellular connection is active. It's slightly slower and costs roaming fees, but you're in complete control of your security. You can now safely access your accounts.",
    attackerNarration:
        "This device is using cellular data — completely outside our attack range. No interception possible.",
    options: [
        {
            id: "s3-complete-tasks",
            text: "Complete your banking and email tasks securely",
            riskDelta: 0,
            nextScene: -1,
            actionLabel: "Complete all tasks",
            evidence: {
                id: "ev-secure-complete",
                title: "Secure Session Complete",
                description: "You completed sensitive tasks on a secure private connection",
                category: "Best Practice",
                collectedAtScene: 3,
                timestamp: 0,
            },
        },
        {
            id: "s3-save-data",
            text: "Switch to free WiFi to save data costs",
            riskDelta: 20,
            nextScene: 0,
            actionLabel: "Find free WiFi instead",
            systemMessage: "Disconnecting from cellular... Searching for WiFi networks.",
        },
    ],
};

const scene4_CredentialsStolen: SceneData = {
    id: 4,
    title: "Something's Wrong",
    description:
        "After entering your credentials, the page shows an error and asks you to try again. Meanwhile, you notice your phone getting warm and the battery draining faster than usual. A few minutes later, you receive an email alert about a login attempt to your account from an unknown location.",
    attackerNarration:
        "SUCCESS! Real credentials captured: email and password harvested. Attempting login to victim's accounts now. Session hijacking in progress...",
    // Time pressure - quick decision needed
    timer: {
        duration: 12,
        defaultOptionIndex: 0,
    },
    options: [
        {
            id: "s4-ignore",
            text: "Probably just a coincidence — continue using this network",
            riskDelta: 30,
            nextScene: -1,
            actionLabel: "Ignore warning signs",
            flagsToSet: { ignoredCompromise: true },
            systemMessage: "Multiple failed login attempts detected from foreign IP addresses...",
            threatToAdd: {
                id: "threat-session-hijack",
                type: "session_hijack",
                severity: "high",
            },
            scheduledLoss: {
                amount: 1500,
                reason: "Session hijacked - unauthorized transactions detected",
                triggerAfterScenes: 1,
            },
        },
        {
            id: "s4-change-password",
            text: "Immediately change your password from your mobile data",
            riskDelta: 5,
            nextScene: -1,
            actionLabel: "Take immediate action",
            evidence: {
                id: "ev-quick-response",
                title: "Rapid Response",
                description: "You immediately changed compromised credentials",
                category: "Damage Control",
                collectedAtScene: 4,
                timestamp: 0,
            },
            threatToResolve: "threat-credential-leak",
            immediateLoss: {
                amount: 200,
                reason: "Password reset service fee",
            },
        },
        {
            id: "s4-disconnect-data",
            text: "Disconnect, enable mobile data, and change all passwords",
            riskDelta: 0,
            nextScene: -1,
            actionLabel: "Full security response",
            evidence: {
                id: "ev-full-response",
                title: "Complete Security Response",
                description: "You disconnected from the threat and secured all accounts",
                category: "Damage Control",
                collectedAtScene: 4,
                timestamp: 0,
            },
            threatToResolve: "threat-credential-leak",
            immediateLoss: {
                amount: 300,
                reason: "Security service fees and password resets",
            },
        },
    ],
};

const scene5_FakeNetworkBrowsing: SceneData = {
    id: 5,
    title: "Browsing on Suspicious Network",
    description:
        "You're connected but something feels off. Some websites show certificate warnings, and you notice URLs sometimes redirect unexpectedly. Your browser flags a site as 'Not Secure'.",
    attackerNarration:
        "SSL stripping in progress. Attempting to downgrade HTTPS connections. Some browsers are blocking our MITM attempts — need to hope user bypasses warnings.",
    options: [
        {
            id: "s5-ignore-warnings",
            text: "Click through the warnings — you need to get things done",
            riskDelta: 40,
            nextScene: -1,
            actionLabel: "Bypass security warnings",
            flagsToSet: { bypassedWarnings: true },
            systemMessage: "Certificate validation bypassed... Unencrypted traffic detected.",
            threatToAdd: {
                id: "threat-device-tracking",
                type: "device_tracked",
                severity: "medium",
            },
            immediateLoss: {
                amount: 400,
                reason: "Bypassed security warnings - data interception risk",
            },
            scheduledLoss: {
                amount: 600,
                reason: "Device tracking - personal data harvested from unencrypted traffic",
                triggerAfterScenes: 2,
            },
        },
        {
            id: "s5-disconnect",
            text: "These are serious red flags — disconnect now",
            riskDelta: -5,
            nextScene: 2,
            actionLabel: "Disconnect immediately",
            evidence: {
                id: "ev-heeded-warnings",
                title: "Heeded Browser Warnings",
                description: "You recognized certificate warnings as signs of network tampering",
                category: "Security Awareness",
                collectedAtScene: 5,
                timestamp: 0,
            },
            threatToResolve: "threat-fake-network",
        },
        {
            id: "s5-only-https",
            text: "Only visit sites that successfully load with HTTPS",
            riskDelta: 15,
            nextScene: 7,
            actionLabel: "Proceed cautiously",
            systemMessage: "Partial traffic encryption maintained. Some data may still be visible.",
        },
    ],
};

const scene6_BankingSession: SceneData = {
    id: 6,
    title: "Banking Session",
    description:
        "You've logged into your bank account and completed the hotel transfer. The payment is confirmed. Now you need to decide how to end your session.",
    attackerNarration:
        "User accessed banking site with HTTPS — traffic is encrypted. Cannot intercept financial data directly. Waiting for session tokens or cookies if possible.",
    options: [
        {
            id: "s6-proper-logout",
            text: "Click 'Log Out', clear browser data, then close the browser",
            riskDelta: 0,
            nextScene: -1,
            actionLabel: "Secure logout",
            evidence: {
                id: "ev-proper-logout",
                title: "Proper Session Closure",
                description: "You properly ended your banking session and cleared data",
                category: "Best Practice",
                collectedAtScene: 6,
                timestamp: 0,
            },
        },
        {
            id: "s6-just-close",
            text: "Just close the browser tab — you're in a hurry",
            riskDelta: 15,
            nextScene: -1,
            actionLabel: "Quick close",
            systemMessage: "Session token may remain active in browser cache...",
        },
        {
            id: "s6-stay-logged",
            text: "Stay logged in — you might need to check something later",
            riskDelta: 25,
            nextScene: -1,
            actionLabel: "Remain logged in",
            flagsToSet: { leftSessionOpen: true },
            systemMessage: "Active banking session detected... Session persistence risk elevated.",
            threatToAdd: {
                id: "threat-banking-session",
                type: "session_hijack",
                severity: "low",
            },
            scheduledLoss: {
                amount: 1000,
                reason: "Session hijacked - unauthorized banking access",
                triggerAfterScenes: 3,
            },
        },
    ],
};

const scene7_SafeConclusion: SceneData = {
    id: 7,
    title: "Safe Travels",
    description:
        "You've made smart security choices during your travel. While it may have required extra patience or cost, your personal information and accounts remain secure. You can continue your journey with peace of mind.",
    attackerNarration:
        "Target practiced good security hygiene. Unable to harvest any valuable data. Packing up equipment and finding a new location.",
    options: [
        {
            id: "s7-finish",
            text: "Continue to your destination",
            riskDelta: 0,
            nextScene: -1,
            actionLabel: "Complete journey",
        },
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Assembled Case Data
// ─────────────────────────────────────────────────────────────────────────────

export const publicWifiCase: CaseData = {
    id: CASE_ID,
    title: CASE_TITLE,
    description: CASE_DESCRIPTION,
    scenes: [
        scene0_AirportArrival,
        scene1_FakeNetwork,
        scene2_SafeNetwork,
        scene3_CellularData,
        scene4_CredentialsStolen,
        scene5_FakeNetworkBrowsing,
        scene6_BankingSession,
        scene7_SafeConclusion,
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Connected Scenarios Case
// ─────────────────────────────────────────────────────────────────────────────

import { createConnectedCase } from "../../../scenarios/scenarioComposer";

/**
 * Connected scenarios case - scenarios react to threats from previous scenarios
 * Chains: Café Wi-Fi → Airport Wi-Fi → Payment Alert
 */
export const connectedScenariosCase: CaseData = createConnectedCase();

export default publicWifiCase;
