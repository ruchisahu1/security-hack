"use client";

import { GameShell } from "../../../components";
import { connectedScenariosCase } from "./case";
import type { Verdict, GameState } from "../../../engine";

/**
 * Public WiFi Game Page
 * Renders the Connected Cybersecurity Scenarios game
 * Scenarios are connected - threats from earlier scenarios affect later ones
 */

export default function PublicWifiGamePage() {
    const handleGameComplete = (verdict: Verdict, finalState: GameState) => {
        console.log("Game completed:", { verdict, finalState });
        // Could send analytics, save progress, etc.
    };

    return (
        <GameShell
            caseData={connectedScenariosCase}
            onGameComplete={handleGameComplete}
        />
    );
}
