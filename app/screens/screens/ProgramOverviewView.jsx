import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function ProgramOverviewView({ plan, onSelectDay, onBack, currentDay, completedDays }) {
    if (!plan) {
        return (
            <QuestionnaireShell>
                <div style={styles.center}>
                    <div style={styles.card}>
                        <h2 style={styles.title}>No program yet.</h2>
                        <p style={styles.subtitle}>Generate a plan to see your weekly breakdown.</p>
                    </div>
                </div>
            </QuestionnaireShell>
        );
    }

    return (
        <QuestionnaireShell>
            <div style={styles.center}>
                <div style={styles.card}>
                    <div style={styles.headerRow}>
                        <div style={styles.header}>
                            <h2 style={styles.title}>Training Program – Overview</h2>
                            {plan.summary && <p style={styles.subtitle}>{plan.summary}</p>}
                        </div>
                        {onBack && (
                            <button style={styles.backButton} onClick={onBack}>
                                Back
                            </button>
                        )}
                    </div>

                    <div style={styles.weeks}>
                        {plan.weeks.map((week) => (
                            <div key={week.week} style={styles.weekBlock}>
                                <div style={styles.weekHeader}>Week {week.week}</div>
                                <div style={styles.daysGrid}>
                                    {week.days.map((day) => {
                                        const key = `${week.week}-${day.day}`;
                                        const isCurrent = currentDay && currentDay.week === week.week && currentDay.day === day.day;
                                        const isDone = completedDays?.has(key);
                                        return (
                                            <button
                                                key={day.day}
                                                onClick={() => onSelectDay(week.week, day.day)}
                                                style={{
                                                    ...styles.dayButton,
                                                    ...(isCurrent ? styles.dayButtonCurrent : {}),
                                                    ...(isDone ? styles.dayButtonDone : {}),
                                                }}
                                            >
                                                Day {day.day}
                                                {isDone && <div style={styles.doneTag}>Finished</div>}
                                                {!isDone && isCurrent && <div style={styles.currentTag}>Current</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </QuestionnaireShell>
    );
}

const styles = {
    center: {
        minHeight: "68vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        width: "100%",
        maxWidth: "960px",
        padding: "26px 28px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px",
    },
    header: { display: "flex", flexDirection: "column", gap: "6px" },
    backButton: {
        padding: "10px 14px",
        fontSize: "16px",
        borderRadius: "10px",
        border: "2px solid #111",
        background: "transparent",
        color: "#111",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    title: { fontSize: "28px", fontWeight: 700, margin: 0 },
    subtitle: { margin: 0, fontSize: "16px", opacity: 0.8, lineHeight: 1.5 },
    weeks: { display: "flex", flexDirection: "column", gap: "14px" },
    weekBlock: {
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#f9f9f9",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    weekHeader: { fontSize: "18px", fontWeight: 700 },
    daysGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" },
    dayButton: {
        padding: "10px 12px",
        borderRadius: "10px",
        border: "2px solid #111",
        background: "#111",
        color: "white",
        cursor: "pointer",
        fontSize: "15px",
        textAlign: "center",
    },
    dayButtonCurrent: {
        borderColor: "#10b981",
        boxShadow: "0 0 0 2px rgba(16,185,129,0.25)",
        position: "relative",
    },
    dayButtonDone: {
        borderColor: "#6b7280",
        background: "#1f2937",
        color: "#e5e7eb",
    },
    currentTag: {
        fontSize: "0.7em",
        color: "#10b981",
        marginTop: "4px",
        fontWeight: 700,
    },
    doneTag: {
        fontSize: "0.7em",
        color: "#9ca3af",
        marginTop: "4px",
        fontWeight: 700,
    },
};
