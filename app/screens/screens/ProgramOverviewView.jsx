import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function PlanSelectionView({ planPreviews, loading, error, onSelectPlan, onBack, onRetry }) {
  if (loading) {
    return (
      <QuestionnaireShell>
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>Loading Training Plans...</Text>
            <Text style={styles.subtitle}>Finding the best plans for your preferences.</Text>
            <ActivityIndicator size="large" color="#111" style={{ marginTop: 20 }} />
          </View>
        </View>
      </QuestionnaireShell>
    );
  }

  if (error) {
    return (
      <QuestionnaireShell>
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>Error Loading Plans</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.actions}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              {onRetry && (
                <TouchableOpacity onPress={onRetry} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </QuestionnaireShell>
    );
  }

  if (!planPreviews || planPreviews.length === 0) {
    return (
      <QuestionnaireShell>
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>No Plans Found</Text>
            <Text style={styles.subtitle}>No training plans match your criteria. Try adjusting your preferences.</Text>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back to Preferences</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </QuestionnaireShell>
    );
  }

  return (
    <QuestionnaireShell>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.wideCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Training Plan</Text>
            <Text style={styles.subtitle}>
              Based on your preferences, here are the available training plans. Review the first week of each plan and select the one that fits you best.
            </Text>
          </View>

          <View style={styles.plansContainer}>
            {planPreviews.map((preview) => (
              <View key={preview.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{preview.name}</Text>
                  <View style={styles.planMeta}>
                    {preview.totalWeeks > 0 && (
                      <Text style={styles.metaBadge}>{preview.totalWeeks} weeks</Text>
                    )}
                    {preview.sessionsPerWeek && (
                      <Text style={styles.metaBadge}>{preview.sessionsPerWeek} sessions/week</Text>
                    )}
                    {preview.goal && (
                      <Text style={styles.metaBadge}>{preview.goal}</Text>
                    )}
                  </View>
                  {preview.description && (
                    <Text style={styles.planDescription}>{preview.description}</Text>
                  )}
                </View>

                {preview.firstWeek && (
                  <View style={styles.weekPreview}>
                    <Text style={styles.weekTitle}>Week 1 Preview</Text>
                    <View style={styles.daysContainer}>
                      {preview.firstWeek.days?.map((day, index) => (
                        <View key={index} style={styles.dayCard}>
                          <Text style={styles.dayHeader}>Day {day.day}</Text>
                          {day.exercises?.slice(0, 4).map((exercise, exIdx) => (
                            <View key={exIdx} style={styles.exerciseItem}>
                              <Text style={styles.exerciseName}>{exercise.name}</Text>
                              {exercise.sets && exercise.reps && (
                                <Text style={styles.exerciseDetail}>{exercise.sets}×{exercise.reps}</Text>
                              )}
                            </View>
                          ))}
                          {day.exercises?.length > 4 && (
                            <Text style={styles.moreExercises}>+{day.exercises.length - 4} more exercises</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity onPress={() => onSelectPlan(preview.id)} style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select This Plan</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.footerActions}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back to Preferences</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, justifyContent: "flex-start", alignItems: "center", padding: 20 },
  card: {
    width: "100%",
    maxWidth: 600,
    padding: 26,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "white",
    gap: 16,
    alignItems: "center",
  },
  wideCard: {
    width: "100%",
    maxWidth: 1100,
    padding: 26,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "white",
    gap: 20,
  },
  header: { gap: 8 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 16, opacity: 0.8, lineHeight: 24 },
  errorText: { fontSize: 16, color: "#dc2626", lineHeight: 24 },
  plansContainer: { gap: 20 },
  planCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#fafafa",
    gap: 16,
  },
  planHeader: { gap: 8 },
  planName: { fontSize: 22, fontWeight: "700", color: "#111" },
  planMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 13,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
    color: "#374151",
    fontWeight: "500",
  },
  planDescription: { fontSize: 15, color: "#4b5563", lineHeight: 22 },
  weekPreview: { gap: 12 },
  weekTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  daysContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dayCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    minWidth: 200,
    flex: 1,
  },
  dayHeader: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#111" },
  exerciseItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  exerciseName: { fontSize: 13, fontWeight: "500", color: "#4b5563" },
  exerciseDetail: { fontSize: 12, color: "#6b7280" },
  moreExercises: { fontSize: 12, color: "#9ca3af", fontStyle: "italic", marginTop: 4 },
  selectButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#10b981",
    backgroundColor: "#10b981",
    alignSelf: "flex-start",
  },
  selectButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  actions: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 10 },
  footerActions: { marginTop: 10 },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111",
    backgroundColor: "#111",
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "500" },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111",
  },
  secondaryButtonText: { color: "#111", fontSize: 16, fontWeight: "500" },
});

// import QuestionnaireShell from "./QuestionnaireShell.jsx";

// export default function ProgramOverviewView({ plan, onSelectDay, onBack, currentDay, completedDays }) {
//     if (!plan) {
//         return (
//             <QuestionnaireShell>
//                 <div style={styles.center}>
//                     <div style={styles.card}>
//                         <h2 style={styles.title}>No program yet.</h2>
//                         <p style={styles.subtitle}>Generate a plan to see your weekly breakdown.</p>
//                     </div>
//                 </div>
//             </QuestionnaireShell>
//         );
//     }

//     return (
//         <QuestionnaireShell>
//             <div style={styles.center}>
//                 <div style={styles.card}>
//                     <div style={styles.headerRow}>
//                         <div style={styles.header}>
//                             <h2 style={styles.title}>Training Program – Overview</h2>
//                             {plan.summary && <p style={styles.subtitle}>{plan.summary}</p>}
//                         </div>
//                         {onBack && (
//                             <button style={styles.backButton} onClick={onBack}>
//                                 Back
//                             </button>
//                         )}
//                     </div>

//                     <div style={styles.weeks}>
//                         {plan.weeks.map((week) => (
//                             <div key={week.week} style={styles.weekBlock}>
//                                 <div style={styles.weekHeader}>Week {week.week}</div>
//                                 <div style={styles.daysGrid}>
//                                     {week.days.map((day) => {
//                                         const key = `${week.week}-${day.day}`;
//                                         const isCurrent = currentDay && currentDay.week === week.week && currentDay.day === day.day;
//                                         const isDone = completedDays?.has(key);
//                                         return (
//                                             <button
//                                                 key={day.day}
//                                                 onClick={() => onSelectDay(week.week, day.day)}
//                                                 style={{
//                                                     ...styles.dayButton,
//                                                     ...(isCurrent ? styles.dayButtonCurrent : {}),
//                                                     ...(isDone ? styles.dayButtonDone : {}),
//                                                 }}
//                                             >
//                                                 Day {day.day}
//                                                 {isDone && <div style={styles.doneTag}>Finished</div>}
//                                                 {!isDone && isCurrent && <div style={styles.currentTag}>Current</div>}
//                                             </button>
//                                         );
//                                     })}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         </QuestionnaireShell>
//     );
// }

// const styles = {
//     center: {
//         minHeight: "68vh",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//     },
//     card: {
//         width: "100%",
//         maxWidth: "960px",
//         padding: "26px 28px",
//         borderRadius: "14px",
//         border: "1px solid rgba(0,0,0,0.08)",
//         background: "white",
//         boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
//         display: "flex",
//         flexDirection: "column",
//         gap: "16px",
//     },
//     headerRow: {
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "flex-start",
//         gap: "12px",
//     },
//     header: { display: "flex", flexDirection: "column", gap: "6px" },
//     backButton: {
//         padding: "10px 14px",
//         fontSize: "16px",
//         borderRadius: "10px",
//         border: "2px solid #111",
//         background: "transparent",
//         color: "#111",
//         cursor: "pointer",
//         whiteSpace: "nowrap",
//     },
//     title: { fontSize: "28px", fontWeight: 700, margin: 0 },
//     subtitle: { margin: 0, fontSize: "16px", opacity: 0.8, lineHeight: 1.5 },
//     weeks: { display: "flex", flexDirection: "column", gap: "14px" },
//     weekBlock: {
//         padding: "14px 16px",
//         borderRadius: "12px",
//         border: "1px solid rgba(0,0,0,0.08)",
//         background: "#f9f9f9",
//         display: "flex",
//         flexDirection: "column",
//         gap: "10px",
//     },
//     weekHeader: { fontSize: "18px", fontWeight: 700 },
//     daysGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" },
//     dayButton: {
//         padding: "10px 12px",
//         borderRadius: "10px",
//         border: "2px solid #111",
//         background: "#111",
//         color: "white",
//         cursor: "pointer",
//         fontSize: "15px",
//         textAlign: "center",
//     },
//     dayButtonCurrent: {
//         borderColor: "#10b981",
//         boxShadow: "0 0 0 2px rgba(16,185,129,0.25)",
//         position: "relative",
//     },
//     dayButtonDone: {
//         borderColor: "#6b7280",
//         background: "#1f2937",
//         color: "#e5e7eb",
//     },
//     currentTag: {
//         fontSize: "0.7em",
//         color: "#10b981",
//         marginTop: "4px",
//         fontWeight: 700,
//     },
//     doneTag: {
//         fontSize: "0.7em",
//         color: "#9ca3af",
//         marginTop: "4px",
//         fontWeight: 700,
//     },
// };
