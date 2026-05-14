import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import StandardText from "../textComponents/StandardText.jsx";

export default function PlanSetTabs({
  prescribedSets = [],
  activeSetIndex = 0,
  completedSetIndexes = [],
  onSelectSet,
}) {
  if (prescribedSets.length <= 1) {
    return null;
  }

  const completedSetIndexSet = new Set(completedSetIndexes);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.setTabsContainer}
    >
      {prescribedSets.map((prescribedSet) => {
        const isActive = prescribedSet.setIndex === activeSetIndex;
        const isCompleted = completedSetIndexSet.has(prescribedSet.setIndex);

        return (
          <TouchableOpacity
            key={prescribedSet.setIndex}
            disabled={!isActive}
            style={[
              styles.setTabButton,
              isActive ? styles.setTabButtonActive : styles.setTabButtonInactive,
              isCompleted && styles.setTabButtonCompleted,
            ]}
            onPress={() => {
              if (isActive) {
                onSelectSet?.(prescribedSet.setIndex);
              }
            }}
          >
            <StandardText
              style={[
                styles.setTabButtonText,
                isActive ? styles.setTabButtonTextActive : styles.setTabButtonTextInactive,
                isCompleted && styles.setTabButtonTextCompleted,
              ]}
            >
              Set{"\n"}
              {prescribedSet.setIndex + 1}
            </StandardText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  setTabsContainer: {
    flexGrow: 1,
    gap: 6,
    justifyContent: "center",
    paddingVertical: 2,
  },
  setTabButton: {
    height: 55,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: "#585858",
    borderStyle: "solid",
    backgroundColor: "#1E1E1E",
  },
  setTabButtonActive: {
    borderColor: "#fff",
    borderStyle: "dashed",
  },
  setTabButtonCompleted: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  setTabButtonInactive: {
    backgroundColor: "#1E1E1E",
  },
  setTabButtonText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  setTabButtonTextActive: {
    color: "#fff",
  },
  setTabButtonTextCompleted: {
    color: "#000",
  },
  setTabButtonTextInactive: {
    color: "#fff",
  },
});
