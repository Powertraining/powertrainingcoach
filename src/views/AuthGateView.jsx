import "/src/style.css";

export default function AuthGateView({ onLogin, onSignup }) {
    return (
        <div style={styles.center}>
            <div style={styles.card}>
                <p style={styles.eyebrow}>Session needed</p>
                <h2 style={styles.title}>Connect to build your plan</h2>
                <p style={styles.subtitle}>
                    Log in or create an account to generate, save, and resume your combat training program.
                </p>

                <div style={styles.actions}>
                    <button type="button" style={styles.primary} onClick={onLogin}>
                        Log in
                    </button>
                    <button type="button" style={styles.secondary} onClick={onSignup}>
                        Create account
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    center: {
        minHeight: "68vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
    },
    card: {
        width: "100%",
        maxWidth: "720px",
        background: "white",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    eyebrow: {
        margin: 0,
        fontSize: "14px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#6b7280",
        fontWeight: 700,
    },
    title: {
        margin: 0,
        fontSize: "30px",
        fontWeight: 800,
        color: "#0f172a",
    },
    subtitle: {
        margin: "4px 0 0",
        fontSize: "17px",
        color: "#334155",
        lineHeight: 1.5,
    },
    bullets: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "8px",
    },
    bullet: {
        fontSize: "14px",
        color: "#1f2937",
        background: "#f8fafc",
        borderRadius: "10px",
        padding: "10px 12px",
        border: "1px solid rgba(0,0,0,0.06)",
    },
    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "10px",
    },
    primary: {
        padding: "12px 20px",
        fontSize: "16px",
        borderRadius: "10px",
        border: "2px solid #111",
        background: "#111",
        color: "white",
        cursor: "pointer",
        fontWeight: 700,
    },
    secondary: {
        padding: "12px 20px",
        fontSize: "16px",
        borderRadius: "10px",
        border: "2px solid #111",
        background: "transparent",
        color: "#111",
        cursor: "pointer",
        fontWeight: 700,
    },
};
