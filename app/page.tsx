import Link from "next/link";

export default function HomePage() {
    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
            }}
        >
            <h1
                style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    marginBottom: "16px",
                }}
            >
                🔐 AI Security Engineer
            </h1>

            <p
                style={{
                    fontSize: "16px",
                    color: "#6b7280",
                    maxWidth: "480px",
                    marginBottom: "32px",
                }}
            >
                Learn how to stay safe on public WiFi networks through interactive
                scenarios. Make choices, see consequences, and build your security
                awareness.
            </p>

            <Link
                href="/games/public-wifi"
                style={{
                    display: "inline-block",
                    padding: "14px 32px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 500,
                    textDecoration: "none",
                }}
            >
                Start Playing →
            </Link>

            <div
                style={{
                    marginTop: "48px",
                    padding: "16px 24px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#6b7280",
                }}
            >
                <strong>Available Cases:</strong>
                <br />
                🌐 The Public Wi-Fi Trap
            </div>
        </main>
    );
}
