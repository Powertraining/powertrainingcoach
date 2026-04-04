import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import {
  getTrainingDayLabel,
  getTrainingDayPreferredWeekday,
  getTrainingPlanSpacingAdvisories,
} from "../../services/utils/trainingPlan.js";

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
            {planPreviews.map((preview) => {
              const previewSpacingAdvisories = preview.firstWeek
                ? getTrainingPlanSpacingAdvisories({
                    weeks: [{ ...preview.firstWeek, week: preview.firstWeek.week || 1 }],
                  })
                : [];

              return (
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
                            <Text style={styles.dayHeader}>{getTrainingDayLabel(day)}</Text>
                            {getTrainingDayPreferredWeekday(day) ? (
                              <Text style={styles.dayWeekday}>
                                Preferred {getTrainingDayPreferredWeekday(day)}
                              </Text>
                            ) : null}
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
                  {previewSpacingAdvisories.length > 0 ? (
                    <View style={styles.spacingBox}>
                      <Text style={styles.spacingTitle}>Spacing advisory</Text>
                      {previewSpacingAdvisories.map((advisory) => (
                        <Text key={advisory.key} style={styles.spacingText}>
                          {advisory.message}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <TouchableOpacity onPress={() => onSelectPlan(preview.id)} style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Select This Plan</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
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
  dayWeekday: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  spacingBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
    gap: 6,
  },
  spacingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },
  spacingText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#78350f",
  },
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

// /**
//  * View for displaying filtered training plans with their first week preview
//  * Allows user to select a plan to adopt
//  */
// export default function PlanSelectionView({
//   planPreviews,
//   loading,
//   error,
//   onSelectPlan,
//   onBack,
//   onRetry,
// }) {
//   if (loading) {
//     return (
//       <QuestionnaireShell>
//         <div style={styles.center}>
//           <div style={styles.card}>
//             <h2 style={styles.title}>Loading Training Plans...</h2>
//             <p style={styles.subtitle}>
//               Finding the best plans for your preferences.
//             </p>
//             <div style={styles.loadingSpinner}></div>
//           </div>
//         </div>
//       </QuestionnaireShell>
//     );
//   }

//   if (error) {
//     return (
//       <QuestionnaireShell>
//         <div style={styles.center}>
//           <div style={styles.card}>
//             <h2 style={styles.title}>Error Loading Plans</h2>
//             <p style={styles.errorText}>{error}</p>
//             <div style={styles.actions}>
//               {onBack && (
//                 <button onClick={onBack} style={styles.secondaryButton}>
//                   Back
//                 </button>
//               )}
//               {onRetry && (
//                 <button onClick={onRetry} style={styles.primaryButton}>
//                   Try Again
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </QuestionnaireShell>
//     );
//   }

//   if (!planPreviews || planPreviews.length === 0) {
//     return (
//       <QuestionnaireShell>
//         <div style={styles.center}>
//           <div style={styles.card}>
//             <h2 style={styles.title}>No Plans Found</h2>
//             <p style={styles.subtitle}>
//               No training plans match your criteria. Try adjusting your
//               preferences.
//             </p>
//             {onBack && (
//               <button onClick={onBack} style={styles.secondaryButton}>
//                 Back to Preferences
//               </button>
//             )}
//           </div>
//         </div>
//       </QuestionnaireShell>
//     );
//   }

//   return (
//     <QuestionnaireShell>
//       <div style={styles.center}>
//         <div style={styles.wideCard}>
//           <div style={styles.header}>
//             <h2 style={styles.title}>Choose Your Training Plan</h2>
//             <p style={styles.subtitle}>
//               Based on your preferences, here are the available training plans.
//               Review the first week of each plan and select the one that fits you
//               best.
//             </p>
//           </div>

//           <div style={styles.plansContainer}>
//             {planPreviews.map((preview) => (
//               <div key={preview.id} style={styles.planCard}>
//                 <div style={styles.planHeader}>
//                   <h3 style={styles.planName}>{preview.name}</h3>
//                   <div style={styles.planMeta}>
//                     {preview.totalWeeks > 0 && (
//                       <span style={styles.metaBadge}>
//                         {preview.totalWeeks} weeks
//                       </span>
//                     )}
//                     {preview.sessionsPerWeek && (
//                       <span style={styles.metaBadge}>
//                         {preview.sessionsPerWeek} sessions/week
//                       </span>
//                     )}
//                     {preview.goal && (
//                       <span style={styles.metaBadge}>{preview.goal}</span>
//                     )}
//                   </div>
//                   {preview.description && (
//                     <p style={styles.planDescription}>{preview.description}</p>
//                   )}
//                 </div>

//                 {preview.firstWeek && (
//                   <div style={styles.weekPreview}>
//                     <h4 style={styles.weekTitle}>Week 1 Preview</h4>
//                     <div style={styles.daysContainer}>
//                       {preview.firstWeek.days?.map((day, index) => (
//                         <div key={index} style={styles.dayCard}>
//                           <div style={styles.dayHeader}>Day {day.day}</div>
//                           <ul style={styles.exerciseList}>
//                             {day.exercises?.slice(0, 4).map((exercise, exIdx) => (
//                               <li key={exIdx} style={styles.exerciseItem}>
//                                 <span style={styles.exerciseName}>
//                                   {exercise.name}
//                                 </span>
//                                 {exercise.sets && exercise.reps && (
//                                   <span style={styles.exerciseDetail}>
//                                     {exercise.sets}×{exercise.reps}
//                                   </span>
//                                 )}
//                               </li>
//                             ))}
//                             {day.exercises?.length > 4 && (
//                               <li style={styles.moreExercises}>
//                                 +{day.exercises.length - 4} more exercises
//                               </li>
//                             )}
//                           </ul>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 <button
//                   onClick={() => onSelectPlan(preview.id)}
//                   style={styles.selectButton}
//                 >
//                   Select This Plan
//                 </button>
//               </div>
//             ))}
//           </div>

//           <div style={styles.footerActions}>
//             {onBack && (
//               <button onClick={onBack} style={styles.secondaryButton}>
//                 Back to Preferences
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </QuestionnaireShell>
//   );
// }

// const styles = {
//   center: {
//     minHeight: "68vh",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "flex-start",
//     padding: "20px 0",
//   },
//   card: {
//     width: "100%",
//     maxWidth: "600px",
//     padding: "26px 28px",
//     borderRadius: "14px",
//     border: "1px solid rgba(0,0,0,0.08)",
//     background: "white",
//     boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "16px",
//     textAlign: "center",
//   },
//   wideCard: {
//     width: "100%",
//     maxWidth: "1100px",
//     padding: "26px 28px",
//     borderRadius: "14px",
//     border: "1px solid rgba(0,0,0,0.08)",
//     background: "white",
//     boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "20px",
//   },
//   header: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "8px",
//   },
//   title: {
//     fontSize: "28px",
//     fontWeight: 700,
//     margin: 0,
//   },
//   subtitle: {
//     margin: 0,
//     fontSize: "16px",
//     opacity: 0.8,
//     lineHeight: 1.5,
//   },
//   errorText: {
//     margin: 0,
//     fontSize: "16px",
//     color: "#dc2626",
//     lineHeight: 1.5,
//   },
//   loadingSpinner: {
//     width: "40px",
//     height: "40px",
//     border: "4px solid #e5e7eb",
//     borderTop: "4px solid #111",
//     borderRadius: "50%",
//     animation: "spin 1s linear infinite",
//     margin: "20px auto",
//   },
//   plansContainer: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "20px",
//   },
//   planCard: {
//     padding: "20px",
//     borderRadius: "12px",
//     border: "2px solid rgba(0,0,0,0.1)",
//     background: "#fafafa",
//     display: "flex",
//     flexDirection: "column",
//     gap: "16px",
//   },
//   planHeader: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "8px",
//   },
//   planName: {
//     fontSize: "22px",
//     fontWeight: 700,
//     margin: 0,
//     color: "#111",
//   },
//   planMeta: {
//     display: "flex",
//     flexWrap: "wrap",
//     gap: "8px",
//   },
//   metaBadge: {
//     padding: "4px 10px",
//     fontSize: "13px",
//     borderRadius: "6px",
//     background: "#e5e7eb",
//     color: "#374151",
//     fontWeight: 500,
//   },
//   planDescription: {
//     margin: 0,
//     fontSize: "15px",
//     color: "#4b5563",
//     lineHeight: 1.5,
//   },
//   weekPreview: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "12px",
//   },
//   weekTitle: {
//     fontSize: "16px",
//     fontWeight: 600,
//     margin: 0,
//     color: "#374151",
//   },
//   daysContainer: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
//     gap: "12px",
//   },
//   dayCard: {
//     padding: "12px",
//     borderRadius: "8px",
//     background: "white",
//     border: "1px solid rgba(0,0,0,0.08)",
//   },
//   dayHeader: {
//     fontSize: "14px",
//     fontWeight: 700,
//     marginBottom: "8px",
//     color: "#111",
//   },
//   exerciseList: {
//     margin: 0,
//     padding: "0 0 0 16px",
//     listStyle: "disc",
//   },
//   exerciseItem: {
//     fontSize: "13px",
//     marginBottom: "4px",
//     color: "#4b5563",
//   },
//   exerciseName: {
//     fontWeight: 500,
//   },
//   exerciseDetail: {
//     marginLeft: "6px",
//     color: "#6b7280",
//     fontSize: "12px",
//   },
//   moreExercises: {
//     fontSize: "12px",
//     color: "#9ca3af",
//     fontStyle: "italic",
//     listStyle: "none",
//     marginLeft: "-16px",
//     marginTop: "4px",
//   },
//   selectButton: {
//     padding: "14px 24px",
//     fontSize: "16px",
//     borderRadius: "10px",
//     border: "2px solid #10b981",
//     background: "#10b981",
//     color: "white",
//     cursor: "pointer",
//     fontWeight: 600,
//     alignSelf: "flex-start",
//     transition: "background 0.2s, border-color 0.2s",
//   },
//   actions: {
//     display: "flex",
//     justifyContent: "center",
//     gap: "12px",
//     marginTop: "10px",
//   },
//   footerActions: {
//     display: "flex",
//     justifyContent: "flex-start",
//     marginTop: "10px",
//   },
//   primaryButton: {
//     padding: "12px 22px",
//     fontSize: "16px",
//     borderRadius: "10px",
//     border: "2px solid #111",
//     background: "#111",
//     color: "white",
//     cursor: "pointer",
//     fontWeight: 500,
//   },
//   secondaryButton: {
//     padding: "12px 22px",
//     fontSize: "16px",
//     borderRadius: "10px",
//     border: "2px solid #111",
//     background: "transparent",
//     color: "#111",
//     cursor: "pointer",
//     fontWeight: 500,
//   },
// };
