import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function ProgramOverviewView({ plan, onSelectDay, onBack, currentDay, completedDays }) {
  if (!plan) {
    return (
      <QuestionnaireShell>
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>No program yet.</Text>
            <Text style={styles.subtitle}>Generate a plan to see your weekly breakdown.</Text>
          </View>
        </View>
      </QuestionnaireShell>
    );
  }

  return (
    <QuestionnaireShell>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={styles.title}>Training Program – Overview</Text>
              {plan.summary && <Text style={styles.subtitle}>{plan.summary}</Text>}
            </View>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.weeks}>
            {plan.weeks?.map((week) => (
              <View key={week.week} style={styles.weekBlock}>
                <Text style={styles.weekHeader}>Week {week.week}</Text>
                <View style={styles.daysGrid}>
                  {week.days?.map((day) => {
                    const key = `${week.week}-${day.day}`;
                    const isCurrent =
                      currentDay &&
                      currentDay.week === week.week &&
                      currentDay.day === day.day;
                    const isDone = completedDays?.has(key);

                    return (
                      <TouchableOpacity
                        key={day.day}
                        onPress={() => onSelectDay(week.week, day.day)}
                        style={[
                          styles.dayButton,
                          isCurrent && styles.dayButtonCurrent,
                          isDone && styles.dayButtonDone,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            isDone && styles.dayButtonDoneText,
                          ]}
                        >
                          Day {day.day}
                        </Text>
                        {isDone && <Text style={styles.doneTag}>Finished</Text>}
                        {!isDone && isCurrent && (
                          <Text style={styles.currentTag}>Current</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 960,
    padding: 26,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "white",
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  header: {
    flex: 1,
    gap: 6,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111",
  },
  backButtonText: {
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 24,
  },
  weeks: {
    gap: 14,
  },
  weekBlock: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#f9f9f9",
    gap: 10,
  },
  weekHeader: {
    fontSize: 18,
    fontWeight: "700",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111",
    backgroundColor: "#111",
    minWidth: 100,
    alignItems: "center",
  },
  dayButtonCurrent: {
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  dayButtonDone: {
    borderColor: "#6b7280",
    backgroundColor: "#1f2937",
  },
  dayButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  dayButtonDoneText: {
    color: "#e5e7eb",
  },
  currentTag: {
    fontSize: 10,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "700",
  },
  doneTag: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 4,
    fontWeight: "700",
  },
});
