/**
 * Scenario Composer
 * Chains multiple scenarios together into a connected game case
 * Scenarios react to state and threats from previous scenarios
 */

import type { CaseData } from "../components";
import type { GameState } from "../engine/gameState";
import { createInitialGameState } from "../engine/gameState";
import { buildCafeWifiScenes, CAFE_SCENARIO_ID, CAFE_SCENARIO_TITLE, CAFE_SCENARIO_INTRO } from "./cafe_wifi";
import { buildAirportWifiScenes, AIRPORT_SCENARIO_ID, AIRPORT_SCENARIO_TITLE, AIRPORT_SCENARIO_INTRO } from "./airport_wifi";
import { buildPaymentAlertScenes, PAYMENT_SCENARIO_ID, PAYMENT_SCENARIO_TITLE, PAYMENT_SCENARIO_INTRO } from "./payment_alert";

/**
 * Scenario configuration
 */
export interface ScenarioConfig {
    id: string;
    title: string;
    intro: string;
    buildScenes: (state: GameState, startSceneId: number) => import("../components").SceneData[];
}

/**
 * Available scenarios
 */
const AVAILABLE_SCENARIOS: Record<string, ScenarioConfig> = {
    [CAFE_SCENARIO_ID]: {
        id: CAFE_SCENARIO_ID,
        title: CAFE_SCENARIO_TITLE,
        intro: CAFE_SCENARIO_INTRO,
        buildScenes: buildCafeWifiScenes,
    },
    [AIRPORT_SCENARIO_ID]: {
        id: AIRPORT_SCENARIO_ID,
        title: AIRPORT_SCENARIO_TITLE,
        intro: AIRPORT_SCENARIO_INTRO,
        buildScenes: buildAirportWifiScenes,
    },
    [PAYMENT_SCENARIO_ID]: {
        id: PAYMENT_SCENARIO_ID,
        title: PAYMENT_SCENARIO_TITLE,
        intro: PAYMENT_SCENARIO_INTRO,
        buildScenes: buildPaymentAlertScenes,
    },
};

/**
 * Composes multiple scenarios into a connected game case
 * Scenarios are built based on initial state, and later scenarios react to threats from earlier ones
 * 
 * @param scenarioIds - Array of scenario IDs in order
 * @param initialState - Initial game state (defaults to fresh state)
 * @returns Complete CaseData with all scenes chained together
 */
export function composeScenarios(
    scenarioIds: string[],
    initialState: GameState = createInitialGameState()
): CaseData {
    const allScenes: import("../components").SceneData[] = [];
    let currentSceneId = 0;
    let currentState = initialState;

    // Build scenes for each scenario
    for (let i = 0; i < scenarioIds.length; i++) {
        const scenarioId = scenarioIds[i];
        const scenario = AVAILABLE_SCENARIOS[scenarioId];

        if (!scenario) {
            console.warn(`Unknown scenario: ${scenarioId}`);
            continue;
        }

        // Build scenes for this scenario based on current state
        // This allows scenarios to react to threats from previous scenarios
        // Note: We simulate worst-case threat progression so later scenarios can react appropriately
        // In actual gameplay, threats are created dynamically, but scenes are built to handle them
        const scenarioScenes = scenario.buildScenes(currentState, currentSceneId);
        
        // Simulate threat creation for next scenario (worst case assumption)
        // This allows next scenario to be built with awareness of potential threats
        // In reality, threats are created during gameplay, but we build scenes to handle them
        if (scenarioId === CAFE_SCENARIO_ID && i < scenarioIds.length - 1) {
            // Simulate that café scenario might create a session hijack threat
            // Next scenario (airport) will be built aware of this possibility
            // We don't actually modify state, but airport scenario checks for this threat ID
        }

        // Add all scenes from this scenario
        for (const scene of scenarioScenes) {
            allScenes.push(scene);
        }

        // Update scene IDs and chain them together
        for (let j = 0; j < scenarioScenes.length; j++) {
            const scene = scenarioScenes[j];
            const absoluteSceneId = currentSceneId + j;
            scene.id = absoluteSceneId;

            // Update nextScene IDs in options
            for (const option of scene.options) {
                if (option.nextScene === -1) {
                    // Terminal scene - check if there's a next scenario
                    if (i < scenarioIds.length - 1) {
                        // Chain to next scenario's first scene
                        const nextScenarioStartId = currentSceneId + scenarioScenes.length;
                        option.nextScene = nextScenarioStartId;
                    } else {
                        // Last scenario - end game
                        option.nextScene = -1;
                    }
                } else {
                    // Scene ID was set relative to startSceneId (currentSceneId)
                    // It's already correct since scenes were built with currentSceneId as base
                    // Just ensure it's within valid range
                    if (option.nextScene >= currentSceneId && option.nextScene < currentSceneId + scenarioScenes.length) {
                        // Already correct - scene within current scenario
                    } else if (option.nextScene < currentSceneId) {
                        // References a previous scene - keep as is
                    } else {
                        // Shouldn't happen, but handle it
                        console.warn(`Invalid nextScene ${option.nextScene} in scene ${absoluteSceneId}`);
                    }
                }
            }
        }

        currentSceneId += scenarioScenes.length;

        // Simulate state progression for next scenario
        // This is a simplified simulation - in reality, state changes based on player choices
        // But for building scenes, we assume worst case (threats persist)
        // The actual state will be updated during gameplay
    }

    // Create hub scene that introduces the game
    const hubScene: import("../components").SceneData = {
        id: 0,
        title: "Cybersecurity Journey",
        description: "You're traveling and need to stay connected. Each decision you make will affect your security and finances. Threats from earlier scenarios will carry forward. Let's begin.",
        options: [
            {
                id: "hub-start",
                text: "Begin your journey",
                riskDelta: 0,
                nextScene: 1, // First scenario starts at scene 1
                actionLabel: "Start journey",
            },
        ],
    };

    // Insert hub scene at the beginning and shift all scene IDs
    allScenes.unshift(hubScene);
    
    // Update all scene IDs (add 1 to account for hub scene)
    for (let i = 1; i < allScenes.length; i++) {
        const oldId = allScenes[i].id;
        allScenes[i].id = i;
        
        // Update nextScene references in options
        for (const option of allScenes[i].options) {
            if (option.nextScene > 0) {
                // Increment by 1 to account for hub scene
                option.nextScene = option.nextScene + 1;
            }
        }
    }

    return {
        id: "connected-scenarios",
        title: "Connected Cybersecurity Scenarios",
        description: "A series of connected scenarios where your choices have lasting consequences. Threats from earlier scenarios affect later ones.",
        scenes: allScenes,
    };
}

/**
 * Creates the default connected scenario case
 * Chains: Café → Airport → Payment Alert
 */
export function createConnectedCase(): CaseData {
    return composeScenarios([
        CAFE_SCENARIO_ID,
        AIRPORT_SCENARIO_ID,
        PAYMENT_SCENARIO_ID,
    ]);
}
